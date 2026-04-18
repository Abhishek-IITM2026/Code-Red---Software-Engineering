from flask import Blueprint, Response, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import SalaryAccountChangeRequest, SalarySlip, StaffSalaryAccount
from ...schemas import SalaryAccountChangeRequestCreate, SalarySlipListQuery, StaffSalaryAccountWriteRequest, parse_json, parse_query
from ...services.pdf_generator import generate_salary_slip_pdf


payroll_bp = Blueprint("payroll", __name__)


def _current_user_id() -> int | None:
    """Get the current logged-in user's ID."""
    return g.current_user.id if hasattr(g, 'current_user') else None


def _current_staff_id() -> str | None:
    """Get the current user's normalized staff identifier."""
    user_id = _current_user_id()
    if not user_id:
        return None
    return str(user_id)


def _current_salary_account() -> StaffSalaryAccount | None:
    user_id = _current_user_id()
    if not user_id:
        return None
    return StaffSalaryAccount.query.filter_by(user_id=user_id).first()


@payroll_bp.get("/salary-slips")
@roles_required("administration", "faculty")
def list_salary_slips():
    filters = parse_query(SalarySlipListQuery, request.args.to_dict())
    query = SalarySlip.query
    if filters.staff_id:
        if filters.staff_id.isdigit():
            query = query.filter_by(user_id=int(filters.staff_id))
        else:
            query = query.filter_by(staff_id=filters.staff_id)
    if filters.year:
        query = query.filter_by(year=filters.year)
    if filters.month_key:
        query = query.filter_by(month_key=filters.month_key)
    return success_response([slip.to_dict() for slip in query.order_by(SalarySlip.month_key.desc()).all()])


@payroll_bp.get("/salary-slips/<string:slip_id>")
@roles_required("administration", "faculty")
def get_salary_slip(slip_id: str):
    slip = _find_slip_by_id(slip_id)
    if slip is None:
        raise ApiError(404, "SALARY_SLIP_NOT_FOUND", "Salary slip not found.")
    return success_response(slip.to_dict())


@payroll_bp.get("/salary-slips/<string:slip_id>/download")
@roles_required("administration", "faculty")
def download_salary_slip(slip_id: str):
    slip = _find_slip_by_id(slip_id)
    if slip is None:
        raise ApiError(404, "SALARY_SLIP_NOT_FOUND", "Salary slip not found.")

    pdf_content = generate_salary_slip_pdf(slip.to_dict())
    filename = f"SalarySlip_{slip.normalized_staff_name.replace(' ', '_')}_{slip.month_label}_{slip.year}.pdf"

    return Response(
        pdf_content,
        mimetype='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Content-Type': 'application/pdf',
        }
    )



@payroll_bp.get("/me/salary-slips")
@roles_required("administration", "faculty")
def list_my_salary_slips():
    """List salary slips for the current logged-in user."""
    user_id = _current_user_id()
    filters = parse_query(SalarySlipListQuery, request.args.to_dict())

    if user_id:
        query = SalarySlip.query.filter_by(user_id=user_id)
    else:
        staff_id = _current_staff_id()
        if staff_id:
            query = SalarySlip.query.filter_by(user_id=int(staff_id))
        else:
            return success_response([])

    if filters.year:
        query = query.filter_by(year=filters.year)

    return success_response([slip.to_dict() for slip in query.order_by(SalarySlip.month_key.desc()).all()])



@payroll_bp.get("/me/salary-slips/<string:slip_id>/download")
@roles_required("administration", "faculty")
def download_my_salary_slip(slip_id: str):
    """Download own salary slip - validates ownership."""
    slip = _find_slip_by_id(slip_id)

    if slip is None:
        raise ApiError(404, "SALARY_SLIP_NOT_FOUND", "Salary slip not found.")

    user_id = _current_user_id()
    if user_id and slip.user_id and slip.user_id != user_id:
        raise ApiError(403, "FORBIDDEN", "You do not have permission to access this salary slip.")

    pdf_content = generate_salary_slip_pdf(slip.to_dict())
    filename = f"SalarySlip_{slip.normalized_staff_name.replace(' ', '_')}_{slip.month_label}_{slip.year}.pdf"

    return Response(
        pdf_content,
        mimetype='application/pdf',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Content-Type': 'application/pdf',
        }
    )


def _find_slip_by_id(slip_id: str) -> SalarySlip | None:
    """Find a salary slip by database id, user-id month key, or legacy identifiers."""
    if slip_id.isdigit():
        slip = SalarySlip.query.filter_by(id=int(slip_id)).first()
        if slip:
            return slip

    if '-' in slip_id:
        parts = slip_id.rsplit('-', 2)
        if len(parts) >= 3:
            user_id_str, year, month = parts[-3], parts[-2], parts[-1]
            if user_id_str.isdigit():
                user_id = int(user_id_str)
                month_key = f"{year}-{month}"
                slip = SalarySlip.query.filter_by(user_id=user_id, month_key=month_key).first()
                if slip:
                    return slip

    parts = slip_id.rsplit('-', 2)
    if len(parts) >= 3:
        staff_id = '-'.join(parts[:-2])
        month_key = f"{parts[-2]}-{parts[-1]}"
        slip = SalarySlip.query.filter_by(staff_id=staff_id, month_key=month_key).first()
        if slip:
            return slip

    slip = SalarySlip.query.filter_by(month_key=slip_id).first()
    if slip:
        return slip

    return None


@payroll_bp.get("/me/account-details")
@roles_required("administration", "faculty")
def get_my_salary_account():
    account = _current_salary_account()
    return success_response(account.to_dict() if account is not None else None)


@payroll_bp.put("/me/account-details")
@roles_required("administration", "faculty")
def save_my_salary_account():
    user_id = _current_user_id()
    if user_id is None:
        raise ApiError(401, "UNAUTHORIZED", "Authentication required.")
    payload = parse_json(StaffSalaryAccountWriteRequest, request.get_json())
    account = StaffSalaryAccount.query.filter_by(user_id=user_id).first()
    if account is None:
        account = StaffSalaryAccount(user_id=user_id)
        db.session.add(account)
    account.account_holder_name = payload.account_holder_name
    account.bank_name = payload.bank_name
    account.account_number = payload.account_number
    account.ifsc_code = payload.ifsc_code
    account.branch_name = payload.branch_name
    account.account_type = payload.account_type
    account.upi_id = payload.upi_id
    account.proof_document_url = payload.proof_document_url
    account.proof_document_name = payload.proof_document_name
    account.verification_status = "approved"
    db.session.commit()
    return success_response(account.to_dict())


@payroll_bp.get("/me/account-change-requests")
@roles_required("administration", "faculty")
def list_my_account_change_requests():
    user_id = _current_user_id()
    requests = SalaryAccountChangeRequest.query.filter_by(user_id=user_id).order_by(
        SalaryAccountChangeRequest.requested_at.desc()
    )
    return success_response([item.to_dict() for item in requests.all()])


@payroll_bp.post("/me/account-change-requests")
@roles_required("administration", "faculty")
def create_my_account_change_request():
    user_id = _current_user_id()
    if user_id is None:
        raise ApiError(401, "UNAUTHORIZED", "Authentication required.")
    payload = parse_json(SalaryAccountChangeRequestCreate, request.get_json())
    change_request = SalaryAccountChangeRequest(
        user_id=user_id,
        requested_data_json=payload.requested_data,
        proof_document_url=payload.proof_document_url,
        proof_document_name=payload.proof_document_name,
        proof_notes=payload.proof_notes,
        status="pending",
    )
    db.session.add(change_request)
    db.session.commit()
    return success_response(change_request.to_dict(), status_code=201)
