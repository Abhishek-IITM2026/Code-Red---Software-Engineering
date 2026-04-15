from flask import Blueprint, current_app, request

from ...common.auth import roles_required
from ...common.responses import success_response
from ...tasks import ingest_documents


rag_bp = Blueprint("rag", __name__)


@rag_bp.post("/ingest")
@roles_required("administration")
def ingest_documents_route():
    payload = request.get_json(silent=True) or {}
    scan_root = payload.get("scanRoot") or current_app.config.get("RAG_SOURCE_ROOT")
    source_path = payload.get("sourcePath")
    triggered_by = payload.get("triggeredBy") or "manual"

    task = ingest_documents.delay(scan_root, source_path, triggered_by)
    return success_response(
        {
            "taskId": task.id,
            "status": getattr(task, "status", "PENDING"),
            "scanRoot": scan_root,
        },
        status_code=202,
    )
