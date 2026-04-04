from flask import Blueprint, g, request

from ...common.auth import roles_required
from ...common.responses import success_response
from ...models import AdministrationStaff, Faculty, SalarySlip
from ...schemas import SalarySlipListQuery, parse_query


payroll_bp = Blueprint("payroll", __name__)


def _current_staff_ids():
    staff_ids: list[str] = []
    faculty = getattr(g.current_user, "faculty", None)
    admin_profile = getattr(g.current_user, "administration_profile", None)

    if faculty is not None:
        staff_ids.append(f"FAC-{faculty.id:03d}")
    if admin_profile is not None:
        staff_ids.append(f"STAFF-{admin_profile.id:03d}")

    return staff_ids


def _profile_for_slip(slip: SalarySlip):
    user = None

    admin_profile = AdministrationStaff.query.filter_by(employee_code=slip.employee_code).first()
    if admin_profile is not None:
        user = admin_profile.user
    elif slip.staff_id.startswith("FAC-"):
        faculty_id = int(slip.staff_id.split("-", 1)[1])
        faculty = Faculty.query.get(faculty_id)
        user = faculty.user if faculty is not None else None
    elif slip.staff_id.startswith("STAFF-"):
        admin_id = int(slip.staff_id.split("-", 1)[1])
        admin_profile = AdministrationStaff.query.get(admin_id)
        user = admin_profile.user if admin_profile is not None else None

    return getattr(user, "financial_profile", None) if user is not None else None


def _serialize_salary_slip(slip: SalarySlip):
    payload = slip.to_dict()
    profile = _profile_for_slip(slip)
    if profile is None:
        return payload

    allowances = profile.earnings_breakdown_json or payload.get("allowances") or []
    base_salary = float(getattr(profile, "base_pay", 0) or 0)
    allowance_total = sum(float(item.get("amount", 0) or 0) for item in allowances)
    current_salary = base_salary + allowance_total
    gross_salary = current_salary + float(payload.get("overtimeAmount") or 0)
    total_deductions = float(payload.get("totalDeductions") or 0)

    payload["baseSalary"] = base_salary
    payload["bankAccount"] = profile.bank_account or payload.get("bankAccount")
    payload["allowances"] = [
        {
            "label": item.get("label", "Component"),
            "amount": float(item.get("amount", 0)),
        }
        for item in allowances
    ]
    payload["grossSalary"] = gross_salary
    payload["netSalary"] = gross_salary - total_deductions
    return payload


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
    return success_response([_serialize_salary_slip(slip) for slip in query.order_by(SalarySlip.month_key.desc()).all()])


@payroll_bp.get("/me/salary-slips")
@roles_required("administration", "faculty")
def list_my_salary_slips():
    filters = parse_query(SalarySlipListQuery, request.args.to_dict())
    query = SalarySlip.query.filter(SalarySlip.staff_id.in_(_current_staff_ids()))
    if filters.year:
        query = query.filter_by(year=filters.year)
    return success_response([_serialize_salary_slip(slip) for slip in query.order_by(SalarySlip.month_key.desc()).all()])
