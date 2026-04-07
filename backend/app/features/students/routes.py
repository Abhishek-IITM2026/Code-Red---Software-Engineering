from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import Material, Student, Subject
from ...schemas import CourseEnrollmentRequest, CoursePaymentRequest, parse_json
from ...services.courses import (
    create_course_enrollment,
    get_student_course_enrollment,
    get_student_course_enrollments,
    list_program_courses_for_class,
    record_course_payment,
    serialize_course_for_student,
)
from ...services.query import get_current_student, get_performance_summary, get_student_subjects


students_bp = Blueprint("students", __name__)


@students_bp.get("")
@roles_required("faculty", "administration")
def list_students():
    class_name = request.args.get("class")
    section = request.args.get("section")
    students = Student.query.all()
    response = []
    for student in students:
        serialized = student.to_dict()
        if class_name and serialized["class"] != class_name and serialized["classId"] != class_name:
            continue
        if section and serialized["section"] != section:
            continue
        response.append(serialized)
    return success_response(response)


@students_bp.get("/me")
@roles_required("student")
def get_me():
    student = get_current_student()
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "No student profile is linked to the current user.")
    return success_response(student.to_dict())


@students_bp.get("/me/subjects")
@roles_required("student")
def get_me_subjects():
    student = get_current_student()
    return success_response(get_student_subjects(student.id))


@students_bp.get("/me/courses")
@roles_required("student")
def get_me_courses():
    student = get_current_student()
    return success_response(get_student_subjects(student.id))


@students_bp.get("/me/subjects/<int:subject_id>/content")
@roles_required("student")
def get_me_subject_content(subject_id: int):
    student = get_current_student()
    subjects = get_student_subjects(student.id)
    if not any(int(subject["id"]) == subject_id for subject in subjects):
        raise ApiError(404, "SUBJECT_NOT_FOUND", "Subject is not available for the current student.")
    materials = Material.query.filter_by(subject_id=subject_id).all()
    return success_response(
        {
            "subjectId": str(subject_id),
            "materials": [material.to_dict() for material in materials],
        }
    )


@students_bp.get("/me/performance")
@roles_required("student")
def get_me_performance():
    student = get_current_student()
    return success_response(get_performance_summary(student.id))


@students_bp.get("/me/upcoming-courses")
@roles_required("student")
def get_me_upcoming_courses():
    student = get_current_student()
    enrollment = student.current_enrollment()
    if enrollment is None:
        return success_response([])
    courses = list_program_courses_for_class(enrollment.class_id)
    return success_response([serialize_course_for_student(course, student) for course in courses])


@students_bp.get("/me/course-enrollments")
@roles_required("student")
def list_my_course_enrollments():
    student = get_current_student()
    enrollments = get_student_course_enrollments(student.id)
    return success_response([enrollment.to_dict() for enrollment in enrollments])


@students_bp.post("/me/course-enrollments")
@roles_required("student")
def enroll_in_course():
    student = get_current_student()
    payload = parse_json(CourseEnrollmentRequest, request.get_json())
    course = db.session.get(Subject, payload.course_id)
    if course is None:
        raise ApiError(404, "COURSE_NOT_FOUND", "Course was not found.")
    enrollment = student.current_enrollment()
    if enrollment is None or course.class_id != enrollment.class_id:
        raise ApiError(403, "FORBIDDEN", "This course is not available for the current student.")

    course_enrollment, created = create_course_enrollment(
        student=student,
        course=course,
        actor=g.current_user,
        payment_plan=payload.payment_plan,
        installment_count=payload.installment_count,
    )
    db.session.commit()
    return success_response(
        course_enrollment.to_dict(),
        message="Course enrollment created." if created else "Course enrollment already exists.",
        status_code=201 if created else 200,
    )


@students_bp.post("/me/course-enrollments/<int:enrollment_id>/payments")
@roles_required("student")
def pay_for_enrollment(enrollment_id: int):
    student = get_current_student()
    payload = parse_json(CoursePaymentRequest, request.get_json())
    enrollment = get_student_course_enrollment(student.id, enrollment_id)
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
            "success": True,
            "payment": payment.to_dict(),
            "enrollment": enrollment.to_dict(),
        },
        status_code=201,
    )


@students_bp.get("/<int:student_id>")
@roles_required("faculty", "administration")
def get_student(student_id: int):
    student = Student.query.get(student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")
    return success_response(student.to_dict())
