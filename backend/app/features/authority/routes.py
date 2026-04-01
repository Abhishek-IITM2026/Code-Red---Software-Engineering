from flask import Blueprint, g, request
from pydantic import TypeAdapter, ValidationError

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import AuthorityAssignment
from ...schemas import AuthorityAssignmentWriteRequest


authority_bp = Blueprint("authority", __name__)

ROLE_AUTHORITY_TEMPLATES = [
    {
        "role": "Director",
        "authorities": ["leaveApproval", "admissionApproval", "staffCreation", "studentPromotion"],
    },
    {
        "role": "Office Administrator",
        "authorities": ["leaveApproval", "admissionApproval", "staffCreation"],
    },
    {
        "role": "Accountant",
        "authorities": ["admissionApproval"],
    },
    {
        "role": "Mathematics Teacher",
        "authorities": ["studentPromotion"],
    },
]


@authority_bp.get("/assignments")
@roles_required("administration")
def list_authority_assignments():
    return success_response([assignment.to_dict() for assignment in AuthorityAssignment.query.order_by(AuthorityAssignment.staff_id.asc()).all()])


@authority_bp.put("/assignments")
@roles_required("administration")
def replace_authority_assignments():
    try:
        payload = TypeAdapter(list[AuthorityAssignmentWriteRequest]).validate_python(request.get_json() or [])
    except ValidationError as exc:
        raise ApiError(422, "VALIDATION_ERROR", "Request validation failed.", {"fields": exc.errors()}) from exc
    AuthorityAssignment.query.delete()
    assignments = []
    updated_by = f"{g.current_user.first_name} {g.current_user.last_name}"
    for item in payload:
        assignment = AuthorityAssignment(
            staff_id=item.staff_id,
            roles_json=item.roles,
            role_template=item.role_template,
            authorities_json=item.authorities,
            updated_by=updated_by,
        )
        db.session.add(assignment)
        assignments.append(assignment)
    db.session.commit()
    return success_response([assignment.to_dict() for assignment in assignments])


@authority_bp.get("/templates")
@roles_required("administration")
def list_authority_templates():
    return success_response(ROLE_AUTHORITY_TEMPLATES)
