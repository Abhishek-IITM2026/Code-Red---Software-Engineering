from flask import Blueprint, g, request

from ...common.auth import auth_required
from ...common.responses import success_response
from ...extensions import db
from ...models import UploadedDocument
from ...upload_storage import save_uploaded_file
from ...api.errors import ApiError


uploads_bp = Blueprint("uploads", __name__)


@uploads_bp.post("/documents")
@auth_required
def upload_document():
    uploaded_file = request.files.get("file")
    if uploaded_file is None:
        raise ApiError(400, "FILE_REQUIRED", "A document file is required.")

    category = (request.form.get("category") or "general").strip().lower() or "general"
    saved_file = save_uploaded_file(uploaded_file, category="documents", kind="document")

    document = UploadedDocument(
        user_id=g.current_user.id,
        category=category,
        original_filename=saved_file["originalName"],
        storage_path=saved_file["storagePath"],
        content_type=saved_file["contentType"],
        size_bytes=saved_file["sizeBytes"],
    )
    db.session.add(document)
    db.session.commit()
    return success_response(document.to_dict(), status_code=201)


@uploads_bp.get("/documents")
@auth_required
def list_documents():
    query = UploadedDocument.query.order_by(UploadedDocument.created_at.desc())
    if not g.current_user.has_any_role("admin", "administration", "director", "superadmin"):
        query = query.filter_by(user_id=g.current_user.id)
    else:
        requested_user_id = request.args.get("userId", type=int)
        if requested_user_id is not None:
            query = query.filter_by(user_id=requested_user_id)
    return success_response([document.to_dict() for document in query.all()])
