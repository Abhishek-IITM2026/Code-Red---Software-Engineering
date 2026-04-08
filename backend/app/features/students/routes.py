from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db, limiter
from ...models import FacultySubjectAssignment, Student, Subject
from ...rag.student_chat import answer_subject_question
from ...schemas import CourseEnrollmentRequest, CoursePaymentRequest, StudentSubjectChatRequest, parse_json
from ...services.ai_settings import get_ai_rate_limit, get_ai_settings
from ...services.materials import get_materials_for_generation, list_subject_materials
from ...services.courses import (
    create_course_enrollment,
    get_student_course_enrollment,
    get_student_course_enrollments,
    list_program_courses_for_class,
    record_course_payment,
    serialize_course_for_student,
)
from ...services.query import (
    build_subject_week_content,
    get_current_student,
    get_enrollment_class_scope_ids,
    get_performance_summary,
    get_student_subjects,
)


students_bp = Blueprint("students", __name__)


def _subject_chat_limit() -> str:
    return get_ai_rate_limit("generate")


@students_bp.get("")
@roles_required("faculty", "administration")
def list_students():
    class_name = request.args.get("class")
    section = request.args.get("section")
    allowed_class_ids: set[str] | None = None
    if g.current_user.has_any_role("faculty", "teacher") and not g.current_user.has_any_role(
        "administration", "admin", "director", "superadmin"
    ):
        faculty_profile = getattr(g.current_user, "faculty", None)
        if faculty_profile is None:
            raise ApiError(403, "FORBIDDEN", "Faculty profile is required to access students.")
        assignments = FacultySubjectAssignment.query.filter_by(faculty_id=faculty_profile.id).all()
        allowed_class_ids = {str(assignment.class_id) for assignment in assignments}
        if not allowed_class_ids:
            return success_response([])

    students = Student.query.all()
    response = []
    for student in students:
        serialized = student.to_dict()
        if allowed_class_ids is not None and serialized["classId"] not in allowed_class_ids:
            continue
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
    subject = db.session.get(Subject, subject_id)
    if subject is None:
        raise ApiError(404, "SUBJECT_NOT_FOUND", "Subject was not found.")
    enrollment = student.current_enrollment()
    return success_response(
        {
            "subjectId": str(subject_id),
            "subjectName": subject.name,
            "weeklyContent": build_subject_week_content(subject, enrollment),
            "materials": list_subject_materials(subject_id),
        }
    )


@students_bp.post("/me/subjects/<int:subject_id>/chat")
@roles_required("student")
@limiter.limit(_subject_chat_limit)
def chat_about_subject(subject_id: int):
    student = get_current_student()
    subjects = get_student_subjects(student.id)
    if not any(int(subject["id"]) == subject_id for subject in subjects):
        raise ApiError(404, "SUBJECT_NOT_FOUND", "Subject is not available for the current student.")

    subject = db.session.get(Subject, subject_id)
    if subject is None:
        raise ApiError(404, "SUBJECT_NOT_FOUND", "Subject was not found.")

    payload = parse_json(StudentSubjectChatRequest, request.get_json())
    materials = get_materials_for_generation(subject_id)
    history = [
        {"role": item.role.strip().lower(), "content": item.content.strip()}
        for item in payload.history
        if item.role.strip() and item.content.strip()
    ]
    result = answer_subject_question(
        subject_name=subject.name,
        question=payload.question.strip(),
        materials=materials,
        history=history,
        ai_settings=get_ai_settings(include_secret=True),
    )
    return success_response(
        {
            "subjectId": str(subject_id),
            "subjectName": subject.name,
            "question": payload.question.strip(),
            **result,
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
    class_scope_ids = get_enrollment_class_scope_ids(enrollment)
    courses = list_program_courses_for_class(class_scope_ids)
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
