from datetime import datetime

from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import auth_required, roles_required
from ...extensions import db
from ...models import User
from ...models.leave import LeaveRequest
from ...schemas import LeaveRequestCreateRequest, LeaveRequestReviewRequest, parse_json
from ...common.responses import success_response


leave_bp = Blueprint("leave", __name__)


def _get_applicant_context(user: User) -> str:
    """Get contextual info for the applicant (class/department)."""
    if user.role_scope == "student" and user.student:
        enrollment = user.student.current_enrollment()
        if enrollment:
            return f"{enrollment.institute_class.name} {enrollment.institute_class.section}"
    elif user.role_scope == "faculty" and user.faculty:
        return user.faculty.subject_specialization or "General"
    return ""


@leave_bp.route("/leave", methods=["GET"])
@roles_required("student", "faculty", "administration")
def list_leave_requests():
    """List leave requests. Students/faculty see only their own, admin sees all."""
    user = g.current_user
    status_filter = request.args.get("status")
    applicant_role_filter = request.args.get("applicantRole")

    if user.role_scope in ("student", "faculty"):
        # Users can only see their own requests
        query = LeaveRequest.query.filter_by(applicant_id=user.id)
    else:
        # Admin can see all, with optional filters
        query = LeaveRequest.query
        if applicant_role_filter:
            query = query.filter_by(applicant_role=applicant_role_filter)
        if status_filter:
            query = query.filter_by(status=status_filter)

    query = query.order_by(LeaveRequest.submitted_at.desc())
    requests = query.all()
    return success_response([req.to_dict() for req in requests])


@leave_bp.route("/leave/<int:request_id>", methods=["GET"])
@auth_required
def get_leave_request(request_id: int):
    """Get a specific leave request."""
    leave_request = db.session.get(LeaveRequest, request_id)
    if not leave_request:
        raise ApiError(404, "LEAVE_NOT_FOUND", "Leave request not found.")

    user = g.current_user
    # Users can only view their own requests, admin can view all
    if leave_request.applicant_id != user.id and user.role_scope != "administration":
        raise ApiError(403, "FORBIDDEN", "You cannot view this leave request.")

    return success_response(leave_request.to_dict())


@leave_bp.route("/leave", methods=["POST"])
@roles_required("student", "faculty")
def create_leave_request():
    """Create a new leave request."""
    user = g.current_user
    payload = parse_json(LeaveRequestCreateRequest, request.get_json())

    try:
        from_date = datetime.strptime(payload.from_date, "%Y-%m-%d").date()
        to_date = datetime.strptime(payload.to_date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ApiError(400, "INVALID_DATE", "Dates must be in YYYY-MM-DD format.") from exc

    if to_date < from_date:
        raise ApiError(400, "INVALID_DATE_RANGE", "End date cannot be before start date.")

    total_days = (to_date - from_date).days + 1

    leave_request = LeaveRequest(
        applicant_id=user.id,
        applicant_role=user.role_scope,
        applicant_context=_get_applicant_context(user),
        leave_type=payload.leave_type,
        from_date=from_date,
        to_date=to_date,
        total_days=total_days,
        reason=payload.reason,
        contact_number=payload.contact_number,
        supporting_note=payload.supporting_note,
        status="Pending",
    )

    db.session.add(leave_request)
    db.session.commit()

    return success_response(leave_request.to_dict(), status_code=201)


@leave_bp.route("/leave/<int:request_id>/review", methods=["PUT"])
@roles_required("administration")
def review_leave_request(request_id: int):
    """Review (approve/reject) a leave request. Admin only."""
    leave_request = db.session.get(LeaveRequest, request_id)
    if not leave_request:
        raise ApiError(404, "LEAVE_NOT_FOUND", "Leave request not found.")

    if leave_request.status != "Pending":
        raise ApiError(400, "ALREADY_REVIEWED", "This leave request has already been reviewed.")

    user = g.current_user
    payload = parse_json(LeaveRequestReviewRequest, request.get_json())

    if payload.status not in ("Approved", "Rejected"):
        raise ApiError(400, "INVALID_STATUS", "Status must be 'Approved' or 'Rejected'.")

    leave_request.status = payload.status
    leave_request.reviewer_id = user.id
    leave_request.reviewer_name = f"{user.first_name} {user.last_name}"
    leave_request.reviewer_comment = payload.reviewer_comment
    leave_request.reviewed_at = datetime.utcnow()

    db.session.commit()

    return success_response(leave_request.to_dict())


@leave_bp.route("/leave/<int:request_id>/cancel", methods=["PUT"])
@auth_required
def cancel_leave_request(request_id: int):
    """Cancel a pending leave request. User can only cancel their own."""
    leave_request = db.session.get(LeaveRequest, request_id)
    if not leave_request:
        raise ApiError(404, "LEAVE_NOT_FOUND", "Leave request not found.")

    user = g.current_user
    if leave_request.applicant_id != user.id:
        raise ApiError(403, "FORBIDDEN", "You can only cancel your own leave requests.")

    if leave_request.status != "Pending":
        raise ApiError(400, "CANNOT_CANCEL", "Only pending requests can be cancelled.")

    db.session.delete(leave_request)
    db.session.commit()

    return success_response({"message": "Leave request cancelled successfully."})


@leave_bp.route("/leave/stats", methods=["GET"])
@roles_required("administration")
def leave_statistics():
    """Get leave request statistics for admin dashboard."""
    total_requests = LeaveRequest.query.count()
    pending_count = LeaveRequest.query.filter_by(status="Pending").count()
    approved_count = LeaveRequest.query.filter_by(status="Approved").count()
    rejected_count = LeaveRequest.query.filter_by(status="Rejected").count()

    student_requests = LeaveRequest.query.filter_by(applicant_role="student").count()
    faculty_requests = LeaveRequest.query.filter_by(applicant_role="faculty").count()

    return success_response({
        "total": total_requests,
        "pending": pending_count,
        "approved": approved_count,
        "rejected": rejected_count,
        "byRole": {
            "student": student_requests,
            "faculty": faculty_requests,
        }
    })