from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required, user_role_names
from ...common.responses import success_response
from ...models import Mark
from ...services.query import get_current_student


marks_bp = Blueprint("marks", __name__)


@marks_bp.get("")
@roles_required("student", "faculty", "administration")
def list_marks():
    query = Mark.query
    if "student" in user_role_names(g.current_user) and request.args.get("studentId"):
        student = get_current_student()
        if str(student.id) != request.args["studentId"]:
            raise ApiError(403, "FORBIDDEN", "Students can only access their own marks.")
    if request.args.get("studentId"):
        query = query.filter_by(student_id=int(request.args["studentId"]))
    elif "student" in user_role_names(g.current_user):
        student = get_current_student()
        query = query.filter_by(student_id=student.id)
    if request.args.get("subjectId"):
        query = query.filter_by(subject_id=int(request.args["subjectId"]))
    if request.args.get("examType"):
        query = query.filter_by(exam_type=request.args["examType"])
    return success_response([mark.to_dict() for mark in query.all()])
