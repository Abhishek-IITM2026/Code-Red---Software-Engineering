from __future__ import annotations

from ..core.celery_app import celery_app
from ..rag.multimodal import ingest_sources


@celery_app.task(name="rag.ingest_documents")
def ingest_documents(scan_root: str | None = None, source_path: str | None = None, triggered_by: str = "manual"):
    """
    Background task to ingest and index documents for RAG.
    Handles app context automatically through Flask-Celery integration.
    """
    from flask import has_app_context, current_app
    from .. import create_app
    
    # If no app context is active, create one
    if not has_app_context():
        app = create_app()
        with app.app_context():
            return ingest_sources(scan_root=scan_root, source_path=source_path, triggered_by=triggered_by)
    
    # Otherwise, use the existing app context
    return ingest_sources(scan_root=scan_root, source_path=source_path, triggered_by=triggered_by)
