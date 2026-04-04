from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...models import Material, Student, UpcomingCourse
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
    courses = UpcomingCourse.query.filter_by(class_id=enrollment.class_id, status="active").order_by(UpcomingCourse.start_date.asc()).all()
    return success_response([course.to_dict() for course in courses])


@students_bp.get("/<int:student_id>")
@roles_required("faculty", "administration")
def get_student(student_id: int):
    student = Student.query.get(student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")
    return success_response(student.to_dict())
