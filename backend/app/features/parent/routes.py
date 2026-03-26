from flask import Blueprint

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...models import Parent
from ...services.query import get_attendance_stats, get_performance_summary


parent_bp = Blueprint("parent", __name__)


def _get_parent():
    parent = Parent.query.first()
    if parent is None:
        raise ApiError(404, "PARENT_NOT_FOUND", "Parent profile was not found.")
    return parent


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
    return success_response(
        {
            "child": parent.student.to_dict(),
            "attendance": get_attendance_stats(child_id),
            "performance": get_performance_summary(child_id),
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
