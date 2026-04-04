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
    EmailChangeRequest,
    ProfilePictureUpdateRequest,
    ProfileUpdateRequest,
    OTP_PURPOSES,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RegisterRequest,
    parse_json,
)
from ...services.email import send_email_message
from ...upload_storage import save_profile_picture_value, save_uploaded_file


# Email templates for OTP
def _build_otp_email_html(code: str, purpose: str, user_name: str | None = None) -> str:
    purpose_messages = {
        "profile_update": "Profile Update Verification",
        "password_change": "Password Change Verification",
        "profile_picture_update": "Profile Picture Update Verification",
        "email_change": "Email Change Verification",
        "password_reset": "Password Reset Request",
        "account_verification": "Account Verification",
    }
    title = purpose_messages.get(purpose, "Verification Code")
    greeting = f"Hello {user_name}," if user_name else "Hello,"
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif;"><table width="100%" style="background-color: #f4f4f4; padding: 40px;"><tr><td align="center"><table style="max-width: 600px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
<tr><td style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">CIOP Platform</h1><p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">""" + title + """</p></td></tr>
<tr><td style="padding: 40px;"><p style="color: #333; font-size: 16px;">""" + greeting + """</p><p style="color: #666; font-size: 14px;">You have requested to """ + purpose.replace("_", " ") + """. Please use the following verification code:</p>
<div style="background: #f0f9ff; border: 2px solid #3b82f6; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;"><p style="color: #666; font-size: 12px; text-transform: uppercase; margin: 0 0 10px;">Your Verification Code</p><p style="color: #1d4ed8; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">""" + code + """</p></div>
<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;"><p style="color: #92400e; font-size: 13px; margin: 0;"><strong>Security Notice:</strong> This code expires in 5 minutes.</p></div></td></tr>
<tr><td style="background: #f9fafb; padding: 20px; text-align: center;"><p style="color: #9ca3af; font-size: 12px; margin: 0;">CIOP Platform</p></td></tr></table></td></tr></table></body></html>"""


def _build_password_changed_email_html(user_name: str) -> str:
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family: Arial, sans-serif;"><table width="100%" style="background-color: #f4f4f4; padding: 40px;"><tr><td align="center"><table style="max-width: 600px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
<tr><td style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 30px; text-align: center;"><h1 style="color: white; margin: 0;">Password Changed Successfully</h1></td></tr>
<tr><td style="padding: 40px;"><p style="color: #333; font-size: 16px;">Hello {user_name},</p><p style="color: #666; font-size: 14px;">Your password has been changed successfully. If you did not make this change, please contact support immediately.</p></td></tr>
<tr><td style="background: #f9fafb; padding: 20px; text-align: center;"><p style="color: #9ca3af; font-size: 12px; margin: 0;">CIOP Platform</p></td></tr></table></td></tr></table></body></html>"""


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

    # Get user for personalization
    user = User.query.filter_by(email=email).first()
    user_name = f"{user.first_name} {user.last_name}" if user else None
    html_body = _build_otp_email_html(challenge.otp_code, purpose, user_name)
    text_body = f"Your one-time password for {purpose.replace('_', ' ')} is: {challenge.otp_code}"
    
    delivery = send_email_message(
        recipients=[email],
        subject=f"Your CIOP verification code - {purpose.replace('_', ' ').title()}",
        text_body=text_body,
        html_body=html_body,
        category="otp",
        related_user_id=user.id if user else None,
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
    user_name = f"{g.current_user.first_name} {g.current_user.last_name}"
    g.current_user.set_password(payload.new_password)
    db.session.commit()
    
    try:
        send_email_message(
            recipients=[g.current_user.email],
            subject="Password Changed Successfully - CIOP Platform",
            text_body=f"Hello {user_name}, your password has been changed successfully.",
            html_body=_build_password_changed_email_html(user_name),
            category="security",
            related_user_id=g.current_user.id,
        )
    except Exception:
        pass
    
    return success_response({"success": True, "message": "Password changed successfully"})


@auth_bp.post("/password/reset-request")
@limiter.limit("3 per hour")
def password_reset_request():
    """Request password reset OTP"""
    payload = parse_json(PasswordResetRequest, request.get_json())
    email = payload.email.strip().lower()
    user = User.query.filter_by(email=email).first()
    if user is None:
        return success_response({"success": True, "message": f"If an account exists with {email}, a reset code has been sent."})
    
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=current_app.config["OTP_EXPIRY_SECONDS"])
    challenge = OtpChallenge(email=email, purpose="password_reset", otp_code=otp_code, expires_at=expires_at)
    db.session.add(challenge)
    db.session.commit()
    
    user_name = f"{user.first_name} {user.last_name}"
    html_body = _build_otp_email_html(otp_code, "password_reset", user_name)
    try:
        send_email_message(recipients=[email], subject="Password Reset - CIOP Platform", text_body=f"Reset code: {otp_code}", html_body=html_body, category="password_reset", related_user_id=user.id)
    except Exception:
        pass
    
    response = {"success": True, "message": f"If an account exists with {email}, a reset code has been sent.", "expiresAt": expires_at.isoformat()}
    if current_app.config.get("EMAIL_DEBUG_INCLUDE_OTP", True):
        response["otp"] = otp_code
    return success_response(response)


@auth_bp.post("/password/reset-confirm")
@limiter.limit("5 per minute")
def password_reset_confirm():
    """Reset password with verified OTP"""
    payload = parse_json(PasswordResetConfirmRequest, request.get_json())
    email = payload.email.strip().lower()
    
    challenge = OtpChallenge.query.filter_by(email=email, purpose="password_reset").order_by(OtpChallenge.id.desc()).first()
    if challenge is None:
        raise ApiError(404, "OTP_NOT_FOUND", "No OTP challenge found.")
    if challenge.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise ApiError(400, "OTP_EXPIRED", "OTP has expired.")
    if challenge.otp_code != payload.otp:
        raise ApiError(400, "OTP_INVALID", "OTP is invalid.")
    
    user = User.query.filter_by(email=email).first()
    if user is None:
        raise ApiError(404, "USER_NOT_FOUND", "User not found.")
    
    user.set_password(payload.new_password)
    challenge.is_verified = True
    db.session.commit()
    
    user_name = f"{user.first_name} {user.last_name}"
    try:
        send_email_message(recipients=[email], subject="Password Reset Successful - CIOP Platform", text_body=f"Hello {user_name}, your password has been reset.", html_body=_build_password_changed_email_html(user_name), category="security", related_user_id=user.id)
    except Exception:
        pass
    
    return success_response({"success": True, "message": "Password reset successfully."})


@auth_bp.post("/email/change-request")
@auth_required
@limiter.limit("3 per hour")
def email_change_request():
    """Request email change"""
    payload = parse_json(EmailChangeRequest, request.get_json())
    new_email = payload.new_email.strip().lower()
    
    if User.query.filter_by(email=new_email).first():
        raise ApiError(409, "EMAIL_EXISTS", "This email is already in use.")
    
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=current_app.config["OTP_EXPIRY_SECONDS"])
    challenge = OtpChallenge(email=new_email, purpose="email_change", otp_code=otp_code, expires_at=expires_at)
    db.session.add(challenge)
    db.session.commit()
    
    html_body = _build_otp_email_html(otp_code, "email_change", g.current_user.first_name)
    try:
        send_email_message(recipients=[new_email], subject="Confirm Email Change - CIOP Platform", text_body=f"Verify code: {otp_code}", html_body=html_body, category="email_change", related_user_id=g.current_user.id)
    except Exception:
        raise ApiError(503, "EMAIL_SEND_FAILED", "Failed to send verification email.")
    
    response = {"success": True, "message": f"Verification code sent to {new_email}", "expiresAt": expires_at.isoformat()}
    if current_app.config.get("EMAIL_DEBUG_INCLUDE_OTP", True):
        response["otp"] = otp_code
    return success_response(response)


@auth_bp.post("/email/change-confirm")
@auth_required
@limiter.limit("5 per minute")
def email_change_confirm():
    """Confirm email change with OTP"""
    payload = parse_json(OtpVerifyRequest, request.get_json())
    new_email = payload.email.strip().lower()
    
    challenge = OtpChallenge.query.filter_by(email=new_email, purpose="email_change").order_by(OtpChallenge.id.desc()).first()
    if challenge is None:
        raise ApiError(404, "OTP_NOT_FOUND", "No OTP challenge found.")
    if challenge.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise ApiError(400, "OTP_EXPIRED", "OTP has expired.")
    if challenge.otp_code != payload.otp:
        raise ApiError(400, "OTP_INVALID", "OTP is invalid.")
    
    old_email = g.current_user.email
    g.current_user.email = new_email
    challenge.is_verified = True
    db.session.commit()
    
    try:
        send_email_message(recipients=[old_email], subject="Email Changed - CIOP Platform", text_body=f"Your email changed from {old_email} to {new_email}.", category="security", related_user_id=g.current_user.id)
    except Exception:
        pass
    
    return success_response({"success": True, "message": "Email changed successfully.", "user": g.current_user.to_dict()})
