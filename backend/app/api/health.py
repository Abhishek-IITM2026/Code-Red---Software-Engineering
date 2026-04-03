from flask import Blueprint, current_app, jsonify

from ..document_store.mongo import InMemoryDocumentStore, MongoDocumentStore, ResilientDocumentStore


health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def healthcheck():
    return jsonify({"status": "ok"}), 200


def _describe_document_store() -> dict:
    store = current_app.extensions.get("document_store")
    status = current_app.extensions.get("document_store_status", {})
    configured_collections = [
        current_app.config.get("MONGO_ASSESSMENT_COLLECTION"),
        current_app.config.get("MONGO_ASSESSMENT_SUBMISSION_COLLECTION"),
    ]
    collections = [name for name in configured_collections if name]

    if isinstance(store, InMemoryDocumentStore):
        return {
            "backend": status.get("backend", "in-memory"),
            "connected": status.get("connected", False),
            "dbName": status.get("dbName", current_app.config.get("MONGO_DB_NAME")),
            "collections": collections,
            "details": {
                "reason": status.get("reason", "MongoDB is unavailable or mock mode is enabled."),
            },
        }

    if isinstance(store, ResilientDocumentStore):
        primary = store.primary
        fallback = store.fallback
        is_mongo_primary = isinstance(primary, MongoDocumentStore)
        is_fallback_memory = isinstance(fallback, InMemoryDocumentStore)

        try:
            if is_mongo_primary:
                primary.client.admin.command("ping")
                collections = sorted(primary.database.list_collection_names()) or collections
                return {
                    "backend": "mongo",
                    "connected": True,
                    "dbName": primary.database.name,
                    "collections": collections,
                    "details": {
                        "fallbackEnabled": is_fallback_memory,
                    },
                }
        except Exception as exc:  # pragma: no cover - depends on runtime infra
            return {
                "backend": "in-memory",
                "connected": False,
                "dbName": current_app.config.get("MONGO_DB_NAME"),
                "collections": collections,
                "details": {
                    "reason": str(exc),
                    "fallbackEnabled": is_fallback_memory,
                    "primaryConfigured": is_mongo_primary,
                },
            }

    return {
        "backend": "unknown",
        "connected": False,
        "dbName": current_app.config.get("MONGO_DB_NAME"),
        "collections": collections,
        "details": {
            "reason": "Document store is not initialized.",
        },
    }


@health_bp.get("/health/document-store")
def document_store_healthcheck():
    return jsonify(_describe_document_store()), 200
