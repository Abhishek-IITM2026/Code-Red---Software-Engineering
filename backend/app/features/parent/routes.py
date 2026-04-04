from flask import Blueprint

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...models import Attendance, Assignment, FacultySubjectAssignment, Mark, Parent, UpcomingCourse
from ...services.query import get_attendance_stats, get_performance_summary, get_student_subjects


parent_bp = Blueprint("parent", __name__)


def _get_parent():
    parent = Parent.query.first()
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
    rows = []
    for subject_id, subject in subjects.items():
        marks = Mark.query.filter_by(student_id=child_id, subject_id=int(subject_id)).all()
        average = round(sum(mark.marks_obtained for mark in marks) / len(marks), 2) if marks else 0
        faculty_assignment = FacultySubjectAssignment.query.filter_by(subject_id=int(subject_id)).first()
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
    enrollment = child.current_enrollment()
    base_amount = 12000 if enrollment and "10" in enrollment.institute_class.name else 9500
    return [
        {"month": "January 2026", "amount": f"Rs. {base_amount:,}", "status": "Paid", "date": "2026-01-05"},
        {"month": "February 2026", "amount": f"Rs. {base_amount:,}", "status": "Paid", "date": "2026-02-05"},
        {"month": "March 2026", "amount": f"Rs. {base_amount:,}", "status": "Pending", "date": "Due 2026-03-15"},
    ]


def _child_faculty_contacts(child_id: int):
    contacts = []
    for subject in get_student_subjects(child_id):
        assignment = FacultySubjectAssignment.query.filter_by(subject_id=int(subject["id"])).first()
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
    courses = UpcomingCourse.query.filter_by(class_id=enrollment.class_id, status="active").order_by(UpcomingCourse.start_date.asc()).all()
    return [course.to_dict() for course in courses]


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
