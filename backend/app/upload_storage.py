from __future__ import annotations

import base64
import binascii
import re
from pathlib import Path
from uuid import uuid4

from flask import current_app, has_request_context, request
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from .api.errors import ApiError


IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
DOCUMENT_EXTENSIONS = {"pdf", "doc", "docx", "txt", "rtf", "csv", "xls", "xlsx", "ppt", "pptx", "zip", "rar", "7z"}
CONTENT_TYPE_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "text/csv": "csv",
    "application/zip": "zip",
    "application/x-zip-compressed": "zip",
}
DATA_URL_PATTERN = re.compile(r"^data:(?P<mime>[-\w.+/]+);base64,(?P<data>.+)$", re.IGNORECASE)


def init_upload_storage(app) -> None:
    upload_root = Path(app.config["UPLOAD_ROOT"])
    upload_root.mkdir(parents=True, exist_ok=True)
    for directory_name in ("profile-pictures", "documents", "images"):
        (upload_root / directory_name).mkdir(parents=True, exist_ok=True)


def build_public_file_url(path_or_url: str | None) -> str | None:
    if not path_or_url:
        return None

    normalized = path_or_url.strip()
    if normalized.startswith(("http://", "https://", "data:")):
        return normalized

    url_prefix = current_app.config["UPLOAD_URL_PREFIX"].rstrip("/")
    if normalized.startswith("/"):
        relative_url = normalized
    else:
        relative_url = f"{url_prefix}/{normalized.lstrip('/')}"

    if has_request_context():
        return f"{request.url_root.rstrip('/')}{relative_url}"
    return relative_url


def save_profile_picture_value(profile_picture: str | None) -> str | None:
    if profile_picture is None:
        return None

    normalized = profile_picture.strip()
    if not normalized:
        return None

    if normalized.startswith("data:"):
        stored = save_data_url_file(normalized, category="profile-pictures", kind="image", filename_hint="profile-picture")
        return stored["storagePath"]

    if normalized.startswith(("http://", "https://", "/")):
        return normalized

    raise ApiError(400, "INVALID_PROFILE_PICTURE", "Profile picture must be a valid URL, upload path, or base64 image data.")


def save_uploaded_file(uploaded_file: FileStorage, *, category: str, kind: str, path_segments: list[str] | None = None) -> dict:
    if uploaded_file.filename is None:
        raise ApiError(400, "FILE_REQUIRED", "A file is required.")

    filename = secure_filename(uploaded_file.filename) or "upload"
    extension = _resolve_extension(filename=filename, content_type=uploaded_file.mimetype, kind=kind)
    payload = uploaded_file.read()
    uploaded_file.stream.seek(0)
    if not payload:
        raise ApiError(400, "EMPTY_FILE", "The uploaded file is empty.")
    _ensure_size_within_limit(len(payload))
    return _write_bytes(
        payload,
        filename=filename,
        extension=extension,
        category=category,
        path_segments=path_segments,
        content_type=uploaded_file.mimetype,
    )


def save_data_url_file(data_url: str, *, category: str, kind: str, filename_hint: str, path_segments: list[str] | None = None) -> dict:
    match = DATA_URL_PATTERN.match(data_url.strip())
    if match is None:
        raise ApiError(400, "INVALID_DATA_URL", "The uploaded payload is not a valid base64 data URL.")

    content_type = match.group("mime").lower()
    extension = _resolve_extension(filename=filename_hint, content_type=content_type, kind=kind)
    try:
        payload = base64.b64decode(match.group("data"), validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ApiError(400, "INVALID_BASE64_FILE", "The uploaded file content could not be decoded.") from exc

    if not payload:
        raise ApiError(400, "EMPTY_FILE", "The uploaded file is empty.")
    _ensure_size_within_limit(len(payload))
    return _write_bytes(
        payload,
        filename=filename_hint,
        extension=extension,
        category=category,
        path_segments=path_segments,
        content_type=content_type,
    )


def _upload_root() -> Path:
    return Path(current_app.config["UPLOAD_ROOT"]).resolve()


def _ensure_size_within_limit(size_bytes: int) -> None:
    max_bytes = current_app.config.get("MAX_CONTENT_LENGTH")
    if max_bytes is not None and size_bytes > max_bytes:
        raise ApiError(413, "FILE_TOO_LARGE", "The uploaded file exceeds the configured size limit.")


def _resolve_extension(*, filename: str, content_type: str | None, kind: str) -> str:
    suffix = Path(filename).suffix.lower().lstrip(".")
    if not suffix and content_type:
        suffix = CONTENT_TYPE_EXTENSIONS.get(content_type.lower(), "")

    allowed_extensions = IMAGE_EXTENSIONS if kind == "image" else DOCUMENT_EXTENSIONS
    if suffix not in allowed_extensions:
        raise ApiError(
            400,
            "UNSUPPORTED_FILE_TYPE",
            f"Unsupported {kind} file type.",
            {"allowedExtensions": sorted(allowed_extensions)},
        )
    return suffix


def _write_bytes(
    payload: bytes,
    *,
    filename: str,
    extension: str,
    category: str,
    path_segments: list[str] | None,
    content_type: str | None,
) -> dict:
    sanitized_category = secure_filename(category) or "uploads"
    sanitized_segments = [segment for segment in (_sanitize_path_segment(item) for item in (path_segments or [])) if segment]
    stored_name = f"{uuid4().hex}.{extension}"
    relative_prefix = "/".join([sanitized_category, *sanitized_segments]) if sanitized_segments else sanitized_category
    relative_path = f"{relative_prefix}/{stored_name}"
    absolute_path = _upload_root() / relative_path
    absolute_path.parent.mkdir(parents=True, exist_ok=True)
    absolute_path.write_bytes(payload)

    return {
        "originalName": filename,
        "storagePath": relative_path,
        "contentType": content_type,
        "sizeBytes": len(payload),
        "url": build_public_file_url(relative_path),
    }


def _sanitize_path_segment(value: str | None) -> str:
    normalized = secure_filename((value or "").strip().replace("/", "-"))
    return normalized or ""
