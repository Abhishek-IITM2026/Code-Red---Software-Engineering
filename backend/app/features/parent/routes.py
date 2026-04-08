from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import Attendance, Assignment, CourseEnrollment, FacultySubjectAssignment, Mark, Parent, Student
from ...schemas import CoursePaymentRequest, parse_json
from ...services.courses import list_program_courses_for_class, record_course_payment, serialize_course_for_student
from ...services.query import (
    get_attendance_stats,
    get_enrollment_class_scope_ids,
    get_performance_summary,
    get_student_subjects,
)


parent_bp = Blueprint("parent", __name__)


def _get_parent():
    parent = Parent.query.filter_by(user_id=g.current_user.id).first()
    if parent is None:
        raise ApiError(404, "PARENT_NOT_FOUND", "Parent profile was not found.")
    return parent


def _child_attendance_rows(child_id: int):
    subjects = {subject["id"]: subject["name"] for subject in get_student_subjects(child_id)}
    rows = []
    for subject_id, subject_name in subjects.items():
        records = Attendance.query.filter_by(student_id=child_id, subject_id=int(subject_id)).all()
        total = len(records)
        attended = len([item for item in records if item.status in {"PRESENT", "LATE"}])
        rows.append(
            {
                "subject": subject_name,
                "attended": str(attended),
                "total": str(total),
                "percentage": f"{round((attended / total) * 100) if total else 0}%",
            }
        )
    return rows


def _child_performance_rows(child_id: int):
    subjects = {subject["id"]: subject for subject in get_student_subjects(child_id)}
    child = db.session.get(Student, child_id)
    enrollment = child.current_enrollment() if child is not None else None
    class_id = enrollment.class_id if enrollment is not None else None
    rows = []
    for subject_id, subject in subjects.items():
        marks = Mark.query.filter_by(student_id=child_id, subject_id=int(subject_id)).all()
        average = round(sum(mark.marks_obtained for mark in marks) / len(marks), 2) if marks else 0
        assignment_query = FacultySubjectAssignment.query.filter_by(subject_id=int(subject_id))
        if class_id is not None:
            assignment_query = assignment_query.filter_by(class_id=class_id)
        faculty_assignment = assignment_query.first()
        teacher_name = ""
        if faculty_assignment and faculty_assignment.faculty and faculty_assignment.faculty.user:
            teacher_name = f"{faculty_assignment.faculty.user.first_name} {faculty_assignment.faculty.user.last_name}"
        rows.append(
            {
                "id": str(subject_id),
                "name": subject["name"],
                "score": f"{round(average)}%",
                "teacher": teacher_name,
                "report": [
                    f"Current average score in {subject['name']} is {round(average)}%.",
                    f"Total assessments recorded: {len(marks)}.",
                    "Performance summary generated from recorded marks.",
                ],
                "syllabus": [assignment.title for assignment in Assignment.query.filter_by(subject_id=int(subject_id)).all()] or ["Syllabus updates will appear here."],
            }
        )
    return rows


def _child_fee_rows(child):
    rows = []
    enrollments = (
        CourseEnrollment.query.filter_by(student_id=child.id)
        .order_by(CourseEnrollment.created_at.desc(), CourseEnrollment.id.desc())
        .all()
    )
    for enrollment in enrollments:
        course_title = enrollment.course.name if enrollment.course is not None else "Course"
        for payment in enrollment.payments:
            rows.append(
                {
                    "month": f"{course_title} - Receipt {payment.receipt_number}",
                    "amount": f"Rs. {payment.amount:,.2f}",
                    "status": "Paid",
                    "date": payment.paid_at.date().isoformat(),
                }
            )
        if enrollment.balance_due > 0:
            rows.append(
                {
                    "month": f"{course_title} - Outstanding",
                    "amount": f"Rs. {enrollment.balance_due:,.2f}",
                    "status": "Pending",
                    "date": enrollment.course.start_date or enrollment.created_at.date().isoformat(),
                }
            )
    return rows


def _child_faculty_contacts(child_id: int):
    child = db.session.get(Student, child_id)
    enrollment = child.current_enrollment() if child is not None else None
    class_id = enrollment.class_id if enrollment is not None else None
    contacts = []
    for subject in get_student_subjects(child_id):
        assignment_query = FacultySubjectAssignment.query.filter_by(subject_id=int(subject["id"]))
        if class_id is not None:
            assignment_query = assignment_query.filter_by(class_id=class_id)
        assignment = assignment_query.first()
        if assignment and assignment.faculty and assignment.faculty.user:
            phone = assignment.faculty.user.contact_profile.phone_number if assignment.faculty.user.contact_profile else "Not available"
            contacts.append(
                {
                    "subject": subject["name"],
                    "faculty": f"{assignment.faculty.user.first_name} {assignment.faculty.user.last_name}",
                    "phone": phone,
                }
            )
    return contacts


def _child_upcoming_courses(child):
    enrollment = child.current_enrollment()
    if enrollment is None:
        return []
    class_scope_ids = get_enrollment_class_scope_ids(enrollment)
    courses = list_program_courses_for_class(class_scope_ids)
    return [serialize_course_for_student(course, child) for course in courses]


def _fee_invoice_payload(enrollment: CourseEnrollment):
    course = enrollment.course
    student = enrollment.student
    student_name = ""
    if student is not None and student.user is not None:
        student_name = f"{student.user.first_name} {student.user.last_name}".strip()

    due_date = (course.start_date if course is not None and course.start_date else enrollment.created_at.date().isoformat())
    status = "paid" if enrollment.balance_due <= 0 else "partially_paid" if enrollment.amount_paid > 0 else "pending"
    return {
        "id": str(enrollment.id),
        "studentId": str(enrollment.student_id),
        "studentName": student_name,
        "invoiceNumber": f"CRS-{enrollment.id:05d}",
        "invoiceDate": enrollment.created_at.date().isoformat(),
        "dueDate": due_date,
        "description": course.name if course is not None else "Course enrollment",
        "amount": float(enrollment.total_fee or 0),
        "paidAmount": float(enrollment.amount_paid or 0),
        "pendingAmount": float(enrollment.balance_due or 0),
        "status": status,
        "createdAt": enrollment.created_at.isoformat(),
        "updatedAt": enrollment.updated_at.isoformat(),
    }


@parent_bp.get("/children")
@roles_required("parent")
def list_children():
    parent = _get_parent()
    child = parent.student.to_dict()
    return success_response([child])


@parent_bp.get("/children/<int:child_id>")
@roles_required("parent")
def get_child(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    return success_response(parent.student.to_dict())


@parent_bp.get("/children/<int:child_id>/dashboard")
@roles_required("parent")
def get_child_dashboard(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    child = parent.student
    return success_response(
        {
            "child": child.to_dict(),
            "attendance": get_attendance_stats(child_id),
            "attendanceRows": _child_attendance_rows(child_id),
            "performance": get_performance_summary(child_id),
            "performanceSubjects": _child_performance_rows(child_id),
            "feeTransactions": _child_fee_rows(child),
            "facultyContacts": _child_faculty_contacts(child_id),
            "upcomingCourses": _child_upcoming_courses(child),
        }
    )


@parent_bp.get("/children/<int:child_id>/attendance")
@roles_required("parent")
def get_child_attendance(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    return success_response(get_attendance_stats(child_id))


@parent_bp.get("/children/<int:child_id>/performance")
@roles_required("parent")
def get_child_performance(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    return success_response(get_performance_summary(child_id))


@parent_bp.get("/students/<int:child_id>/fees")
@roles_required("parent")
def get_child_fee_invoices(child_id: int):
    parent = _get_parent()
    if parent.student_id != child_id:
        raise ApiError(403, "FORBIDDEN", "You can only access linked children.")
    enrollments = (
        CourseEnrollment.query.filter_by(student_id=child_id)
        .order_by(CourseEnrollment.created_at.desc(), CourseEnrollment.id.desc())
        .all()
    )
    return success_response([_fee_invoice_payload(enrollment) for enrollment in enrollments])


@parent_bp.get("/fees/<int:invoice_id>")
@roles_required("parent")
def get_fee_invoice(invoice_id: int):
    parent = _get_parent()
    enrollment = CourseEnrollment.query.filter_by(id=invoice_id, student_id=parent.student_id).first()
    if enrollment is None:
        raise ApiError(404, "FEE_INVOICE_NOT_FOUND", "Fee invoice was not found.")
    return success_response(_fee_invoice_payload(enrollment))


@parent_bp.get("/fees/<int:invoice_id>/download")
@roles_required("parent")
def download_fee_invoice(invoice_id: int):
    parent = _get_parent()
    enrollment = CourseEnrollment.query.filter_by(id=invoice_id, student_id=parent.student_id).first()
    if enrollment is None:
        raise ApiError(404, "FEE_INVOICE_NOT_FOUND", "Fee invoice was not found.")
    return success_response({"url": f"/api/parent/fees/{invoice_id}"})


@parent_bp.post("/fees/<int:invoice_id>/payment")
@roles_required("parent")
def record_fee_payment(invoice_id: int):
    parent = _get_parent()
    enrollment = CourseEnrollment.query.filter_by(id=invoice_id, student_id=parent.student_id).first()
    if enrollment is None:
        raise ApiError(404, "FEE_INVOICE_NOT_FOUND", "Fee invoice was not found.")
    payload = parse_json(CoursePaymentRequest, request.get_json())
    payment = record_course_payment(
        enrollment=enrollment,
        actor=g.current_user,
        amount=payload.amount,
        payment_method=payload.payment_method,
        reference_number=payload.reference_number,
    )
    db.session.commit()
    return success_response(
        {
            "invoice": _fee_invoice_payload(enrollment),
            "payment": payment.to_dict(),
        },
        status_code=201,
    )
