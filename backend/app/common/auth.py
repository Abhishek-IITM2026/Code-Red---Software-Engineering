from functools import wraps

from flask import current_app, g, request
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from ..api.errors import ApiError
from ..extensions import db
from ..models import User, UserStatus


ROLE_ALIASES = {
    "student": {"student"},
    "faculty": {"faculty", "teacher"},
    "parent": {"parent"},
    "administration": {"admin", "administration", "director", "superadmin", "super admin"},
    "admin": {"admin", "administration", "director", "superadmin", "super admin"},
    "director": {"director"},
    "superadmin": {"superadmin", "super admin"},
}


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


def generate_token(user_id: int) -> str:
    return _serializer().dumps({"user_id": user_id})


def verify_token(token: str):
    try:
        return _serializer().loads(token, max_age=86400)
    except SignatureExpired as exc:
        raise ApiError(401, "TOKEN_EXPIRED", "Authentication token has expired.") from exc
    except BadSignature as exc:
        raise ApiError(401, "INVALID_TOKEN", "Authentication token is invalid.") from exc


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            raise ApiError(401, "AUTH_REQUIRED", "Bearer token is required.")

        token = header.split(" ", 1)[1]
        payload = verify_token(token)
        user = db.session.get(User, payload["user_id"])
        if user is None:
            raise ApiError(401, "USER_NOT_FOUND", "Authenticated user no longer exists.")
        if user.status != UserStatus.ACTIVE:
            raise ApiError(403, "ACCOUNT_INACTIVE", "Your account is inactive. Please contact administration.")

        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def normalize_role_name(role: str | None) -> str:
    return (role or "").strip().lower()


def user_role_names(user: User) -> set[str]:
    aliases = set(user.role_names)
    aliases.update({normalize_role_name(user.role_scope), normalize_role_name(user.title)})
    if aliases & {"teacher", "faculty"}:
        aliases.update({"teacher", "faculty"})
    if aliases & {"admin", "administration", "director", "superadmin", "super admin"}:
        aliases.update({"admin", "administration"})
    return {name for name in aliases if name}


def roles_required(*allowed_roles: str):
    allowed_names = set()
    for role in allowed_roles:
        normalized = normalize_role_name(role)
        allowed_names.add(normalized)
        allowed_names.update(ROLE_ALIASES.get(normalized, set()))

    def decorator(fn):
        @wraps(fn)
        @auth_required
        def wrapper(*args, **kwargs):
            current_names = user_role_names(g.current_user)
            if current_names.isdisjoint(allowed_names):
                raise ApiError(403, "FORBIDDEN", "You do not have permission to access this endpoint.", {"allowedRoles": sorted(allowed_names)})
            return fn(*args, **kwargs)

        return wrapper

    return decorator
