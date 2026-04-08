from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required, user_role_names
from ...common.responses import success_response
from ...models import FacultySubjectAssignment, Mark
from ...services.query import get_current_student


marks_bp = Blueprint("marks", __name__)


@marks_bp.get("")
@roles_required("student", "faculty", "administration")
def list_marks():
    query = Mark.query
    current_role_names = user_role_names(g.current_user)
    is_student = "student" in current_role_names
    is_faculty = "faculty" in current_role_names or "teacher" in current_role_names

    if is_student and request.args.get("studentId"):
        student = get_current_student()
        if str(student.id) != request.args["studentId"]:
            raise ApiError(403, "FORBIDDEN", "Students can only access their own marks.")

    if is_faculty and not g.current_user.has_any_role("administration", "admin", "director", "superadmin"):
        faculty_profile = getattr(g.current_user, "faculty", None)
        if faculty_profile is None:
            raise ApiError(403, "FORBIDDEN", "Faculty profile is required to access marks.")
        assignments = FacultySubjectAssignment.query.filter_by(faculty_id=faculty_profile.id).all()
        allowed_subject_ids = {assignment.subject_id for assignment in assignments}
        if not allowed_subject_ids:
            return success_response([])
        query = query.filter(Mark.subject_id.in_(allowed_subject_ids))

    if request.args.get("studentId"):
        query = query.filter_by(student_id=int(request.args["studentId"]))
    elif is_student:
        student = get_current_student()
        query = query.filter_by(student_id=student.id)
    if request.args.get("subjectId"):
        query = query.filter_by(subject_id=int(request.args["subjectId"]))
    if request.args.get("examType"):
        query = query.filter_by(exam_type=request.args["examType"])
    return success_response([mark.to_dict() for mark in query.all()])
