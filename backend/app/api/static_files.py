from pathlib import Path

from flask import Blueprint, abort, current_app, send_from_directory
from werkzeug.utils import safe_join


static_files_bp = Blueprint("static_files", __name__)


@static_files_bp.get("/uploads/<path:filename>")
def serve_uploaded_file(filename: str):
    upload_root = str(Path(current_app.config["UPLOAD_ROOT"]).resolve())
    safe_path = safe_join(upload_root, filename)
    if safe_path is None or not Path(safe_path).is_file():
        abort(404)
    return send_from_directory(upload_root, filename)
