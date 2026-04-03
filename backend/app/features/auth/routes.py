import random
from datetime import datetime, timedelta, timezone

from flask import Blueprint, current_app, g, request

from ...api.errors import ApiError
from ...common.auth import auth_required, generate_token, normalize_role_name, verify_token
from ...common.responses import success_response
from ...extensions import db, limiter
from ...models import OtpChallenge, Role, User, UserContactProfile
from ...schemas import (
    ChangePasswordRequest,
    LoginRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    ProfilePictureUpdateRequest,
    ProfileUpdateRequest,
    RegisterRequest,
    parse_json,
)
from ...services.email import send_email_message
from ...upload_storage import save_profile_picture_value, save_uploaded_file


auth_bp = Blueprint("auth", __name__)


ROLE_MAP = {
    "student": "student",
    "faculty": "faculty",
    "teacher": "faculty",
    "parent": "parent",
    "admin": "admin",
    "administration": "administration",
    "director": "director",
    "superadmin": "superadmin",
    "super admin": "superadmin",
}


@auth_bp.post("/login")
@limiter.limit("20 per minute")
def login():
    payload = parse_json(LoginRequest, request.get_json())
    user = User.query.filter_by(email=payload.email.strip().lower()).first()
    if user is None or not user.check_password(payload.password):
        raise ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.")

    user.last_login_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.session.commit()
    return success_response({"user": user.to_dict(), "token": generate_token(user.id)})


@auth_bp.post("/register")
@limiter.limit("10 per hour")
def register():
    payload = parse_json(RegisterRequest, request.get_json())
    email = payload.email.strip().lower()
    if not email or not payload.password or not payload.first_name or not payload.last_name:
        raise ApiError(400, "VALIDATION_ERROR", "email, password, firstName and lastName are required.")
    if User.query.filter_by(email=email).first():
        raise ApiError(409, "EMAIL_ALREADY_EXISTS", "A user with this email already exists.")

    requested_role = normalize_role_name(payload.role)
    mapped_role = ROLE_MAP.get(requested_role)
    if mapped_role is None:
        raise ApiError(400, "INVALID_ROLE", "Unsupported role value was provided.", {"supportedRoles": sorted(ROLE_MAP)})
    role = Role.query.filter_by(name=mapped_role).first()
    if role is None:
        raise ApiError(500, "ROLE_SETUP_ERROR", "Requested role is not configured in the database.", {"role": mapped_role})
    user = User(
        email=email,
        title=payload.title,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    user.set_password(payload.password)
    user.roles.append(role)
    db.session.add(user)
    db.session.commit()
    return success_response({"user": user.to_dict(), "token": generate_token(user.id)}, status_code=201)


@auth_bp.post("/logout")
def logout():
    return success_response({"success": True}, message="Logged out successfully.")


@auth_bp.get("/me")
@auth_required
def me():
    return success_response(g.current_user.to_dict())


@auth_bp.post("/refresh")
def refresh():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        raise ApiError(401, "AUTH_REQUIRED", "Bearer token is required.")
    payload = verify_token(header.split(" ", 1)[1])
    user = db.session.get(User, payload["user_id"])
    if user is None:
        raise ApiError(401, "USER_NOT_FOUND", "Authenticated user no longer exists.")
    return success_response({"user": user.to_dict(), "token": generate_token(user.id)})


@auth_bp.post("/otp/send")
@limiter.limit("5 per minute")
def send_otp():
    payload = parse_json(OtpSendRequest, request.get_json())
    email = payload.email.strip().lower()
    purpose = payload.purpose
    if not email or not purpose:
        raise ApiError(400, "VALIDATION_ERROR", "email and purpose are required.")

    challenge = OtpChallenge(
        email=email,
        purpose=purpose,
        otp_code=f"{random.randint(100000, 999999)}",
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=current_app.config["OTP_EXPIRY_SECONDS"]),
    )
    db.session.add(challenge)
    db.session.commit()

    delivery = send_email_message(
        recipients=[email],
        subject="Your CIOP verification code",
        text_body=(
            f"Your one-time password for {purpose} is {challenge.otp_code}. "
            f"It expires at {challenge.expires_at.isoformat()}."
        ),
        category="otp",
        related_user_id=user.id if (user := User.query.filter_by(email=email).first()) is not None else None,
    )

    response_payload = {
        "success": True,
        "message": f"OTP sent to {email}",
        "expiresAt": challenge.expires_at.isoformat(),
        "deliveryStatus": delivery.status,
        "emailMessageId": str(delivery.id),
    }
    if current_app.config.get("EMAIL_DEBUG_INCLUDE_OTP", True):
        response_payload["otp"] = challenge.otp_code
    return success_response(response_payload)


@auth_bp.post("/otp/verify")
@limiter.limit("10 per minute")
def verify_otp():
    payload = parse_json(OtpVerifyRequest, request.get_json())
    challenge = (
        OtpChallenge.query.filter_by(email=payload.email.strip().lower(), purpose=payload.purpose)
        .order_by(OtpChallenge.id.desc())
        .first()
    )
    if challenge is None:
        raise ApiError(404, "OTP_NOT_FOUND", "No OTP challenge found for the provided email and purpose.")
    if challenge.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise ApiError(400, "OTP_EXPIRED", "OTP has expired.")
    if challenge.otp_code != payload.otp:
        raise ApiError(400, "OTP_INVALID", "OTP is invalid.")

    challenge.is_verified = True
    db.session.commit()
    return success_response({"success": True, "message": "OTP verified successfully"})


def _require_verified_otp(user_email: str, purpose: str):
    challenge = (
        OtpChallenge.query.filter_by(email=user_email.lower(), purpose=purpose, is_verified=True)
        .order_by(OtpChallenge.id.desc())
        .first()
    )
    if challenge is None or challenge.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise ApiError(403, "OTP_VERIFICATION_REQUIRED", "A verified OTP is required before this action.")


@auth_bp.post("/profile/update")
@auth_required
def update_profile():
    _require_verified_otp(g.current_user.email, "profile_update")
    payload = parse_json(ProfileUpdateRequest, request.get_json())
    g.current_user.first_name = payload.first_name or g.current_user.first_name
    g.current_user.last_name = payload.last_name or g.current_user.last_name
    if payload.phone is not None:
        if g.current_user.contact_profile is None:
            db.session.add(UserContactProfile(user_id=g.current_user.id, phone_number=payload.phone))
        else:
            g.current_user.contact_profile.phone_number = payload.phone
    db.session.commit()
    return success_response({"success": True, "message": "Profile updated successfully", "user": g.current_user.to_dict()})


@auth_bp.post("/profile/picture")
@auth_required
def update_profile_picture():
    _require_verified_otp(g.current_user.email, "profile_picture_update")
    uploaded_file = request.files.get("file")
    if uploaded_file is not None:
        file_record = save_uploaded_file(uploaded_file, category="profile-pictures", kind="image")
        g.current_user.profile_image_url = file_record["storagePath"]
    else:
        payload = parse_json(ProfilePictureUpdateRequest, request.get_json())
        g.current_user.profile_image_url = save_profile_picture_value(payload.profile_picture)
    db.session.commit()
    return success_response({"success": True, "message": "Profile picture updated successfully", "user": g.current_user.to_dict()})


@auth_bp.post("/profile/change-password")
@auth_required
def change_password():
    _require_verified_otp(g.current_user.email, "password_change")
    payload = parse_json(ChangePasswordRequest, request.get_json())
    if not g.current_user.check_password(payload.current_password):
        raise ApiError(400, "INVALID_CURRENT_PASSWORD", "Current password is incorrect.")
    if payload.new_password != payload.confirm_password:
        raise ApiError(400, "PASSWORD_MISMATCH", "New password and confirmation password do not match.")
    g.current_user.set_password(payload.new_password)
    db.session.commit()
    return success_response({"success": True, "message": "Password changed successfully"})
