from flask import Blueprint

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...models import InstituteClass


academics_bp = Blueprint("academics", __name__)


@academics_bp.get("/classes")
@roles_required("student", "faculty", "parent", "administration")
def list_classes():
    return success_response([item.to_dict() for item in InstituteClass.query.all()])


@academics_bp.get("/classes/<int:class_id>/sections")
@roles_required("student", "faculty", "parent", "administration")
def list_sections(class_id: int):
    institute_class = InstituteClass.query.get(class_id)
    if institute_class is None:
        raise ApiError(404, "CLASS_NOT_FOUND", "Class was not found.")
    return success_response([{"id": institute_class.section or "", "name": institute_class.section or ""}])
