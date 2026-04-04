from flask import Blueprint, g, request

from ...common.auth import roles_required
from ...common.responses import success_response
from ...models import SalarySlip
from ...schemas import SalarySlipListQuery, parse_query


payroll_bp = Blueprint("payroll", __name__)


def _current_staff_ids():
    role_scope = g.current_user.role_scope
    if role_scope == "faculty":
        return ["ST-201"]
    if role_scope == "administration":
        return ["ST-203"]
    return []


@payroll_bp.get("/salary-slips")
@roles_required("administration", "faculty")
def list_salary_slips():
    filters = parse_query(SalarySlipListQuery, request.args.to_dict())
    query = SalarySlip.query
    if filters.staff_id:
        query = query.filter_by(staff_id=filters.staff_id)
    if filters.year:
        query = query.filter_by(year=filters.year)
    if filters.month_key:
        query = query.filter_by(month_key=filters.month_key)
    return success_response([slip.to_dict() for slip in query.order_by(SalarySlip.month_key.desc()).all()])


@payroll_bp.get("/me/salary-slips")
@roles_required("administration", "faculty")
def list_my_salary_slips():
    filters = parse_query(SalarySlipListQuery, request.args.to_dict())
    query = SalarySlip.query.filter(SalarySlip.staff_id.in_(_current_staff_ids()))
    if filters.year:
        query = query.filter_by(year=filters.year)
    return success_response([slip.to_dict() for slip in query.order_by(SalarySlip.month_key.desc()).all()])
