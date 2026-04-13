from __future__ import annotations

from datetime import datetime
from typing import Any

from flask import current_app

from ..document_store import get_document_store


def _utcnow() -> str:
    return datetime.utcnow().isoformat()


class _CollectionRepository:
    def __init__(self, collection: str):
        self.store = get_document_store()
        self.collection = collection

    def find_one(self, document_id: str | None) -> dict[str, Any] | None:
        return self.store.find_one(self.collection, document_id)

    def find_one_by_filters(self, filters: dict[str, Any]) -> dict[str, Any] | None:
        documents = self.store.find_many(self.collection, filters, limit=1)
        return documents[0] if documents else None

    def get_all_text_for_material(self, source_key: str) -> str:
        doc = self.find_one_by_filters({"sourceKey": source_key})
        return doc.get("contentText", "") if doc else ""

    def find_many(self, filters: dict[str, Any] | None = None, *, limit: int | None = None) -> list[dict[str, Any]]:
        return self.store.find_many(self.collection, filters, limit=limit)

    def upsert_by_filters(self, filters: dict[str, Any], payload: dict[str, Any]) -> str:
        existing = self.find_one_by_filters(filters)
        document_payload = {**filters, **payload}
        if existing and existing.get("_id"):
            return self.store.update_one(self.collection, existing["_id"], document_payload)
        return self.store.insert_one(self.collection, document_payload)

    def delete_by_filters(self, filters: dict[str, Any]) -> None:
        for document in self.find_many(filters):
            document_id = document.get("_id")
            if document_id:
                self.store.delete_one(self.collection, document_id)


class RAGIngestionRunRepository(_CollectionRepository):
    def __init__(self):
        super().__init__(current_app.config.get("MONGO_RAG_INGESTION_COLLECTION", "rag_ingestion_runs"))

    def get_active_run(self, *, run_type: str) -> dict[str, Any] | None:
        return self.find_one_by_filters({"runType": run_type, "status": "running"})

    def create_run(self, *, run_type: str, scan_root: str, triggered_by: str, source_path: str | None = None) -> str:
        payload = {
            "runType": run_type,
            "scanRoot": scan_root,
            "triggeredBy": triggered_by,
            "sourcePath": source_path,
            "status": "running",
            "createdAt": _utcnow(),
            "updatedAt": _utcnow(),
            "summary": {
                "processed": 0,
                "skipped": 0,
                "failed": 0,
                "unsupported": 0,
            },
        }
        return self.store.insert_one(self.collection, payload)

    def update_run(self, run_id: str, **payload: Any) -> None:
        current = self.store.find_one(self.collection, run_id) or {}
        next_payload = {
            key: value
            for key, value in current.items()
            if key != "_id"
        }
        next_payload.update(payload)
        next_payload["updatedAt"] = _utcnow()
        self.store.update_one(self.collection, run_id, next_payload)


class RAGDocumentRepository(_CollectionRepository):
    def __init__(self):
        super().__init__(current_app.config.get("MONGO_RAG_DOCUMENT_COLLECTION", "rag_documents"))

    def upsert_document(self, source_key: str, payload: dict[str, Any]) -> str:
        return self.upsert_by_filters({"sourceKey": source_key}, {**payload, "updatedAt": _utcnow()})


class RAGChunkRepository(_CollectionRepository):
    def __init__(self):
        super().__init__(current_app.config.get("MONGO_RAG_CHUNK_COLLECTION", "rag_chunks"))

    def upsert_chunk(self, chunk_key: str, payload: dict[str, Any]) -> str:
        return self.upsert_by_filters({"chunkKey": chunk_key}, {**payload, "updatedAt": _utcnow()})


class RAGImageRepository(_CollectionRepository):
    def __init__(self):
        super().__init__(current_app.config.get("MONGO_RAG_IMAGE_COLLECTION", "rag_images"))

    def upsert_image(self, image_key: str, payload: dict[str, Any]) -> str:
        return self.upsert_by_filters({"imageKey": image_key}, {**payload, "updatedAt": _utcnow()})


class StudentChatThreadRepository(_CollectionRepository):
    def __init__(self):
        super().__init__(current_app.config.get("MONGO_STUDENT_CHAT_THREAD_COLLECTION", "student_chat_threads"))

    def get_or_create(self, *, student_id: int, subject_id: int, subject_name: str) -> dict[str, Any]:
        filters = {"studentId": str(student_id), "subjectId": str(subject_id)}
        thread = self.find_one_by_filters(filters)
        if thread:
            return thread
        thread_id = self.store.insert_one(
            self.collection,
            {
                **filters,
                "subjectName": subject_name,
                "summary": "",
                "createdAt": _utcnow(),
                "updatedAt": _utcnow(),
            },
        )
        return self.store.find_one(self.collection, thread_id) or {}

    def update_summary(self, thread_id: str, summary: str) -> None:
        thread = self.store.find_one(self.collection, thread_id)
        if not thread:
            return
        payload = {key: value for key, value in thread.items() if key != "_id"}
        payload["summary"] = summary
        payload["updatedAt"] = _utcnow()
        self.store.update_one(self.collection, thread_id, payload)


class StudentChatMessageRepository(_CollectionRepository):
    def __init__(self):
        super().__init__(current_app.config.get("MONGO_STUDENT_CHAT_MESSAGE_COLLECTION", "student_chat_messages"))

    def create_message(
        self,
        *,
        thread_id: str,
        role: str,
        content: str,
        week: str | None = None,
        citations: list[dict[str, Any]] | None = None,
        referenced_images: list[dict[str, Any]] | None = None,
    ) -> str:
        return self.store.insert_one(
            self.collection,
            {
                "threadId": thread_id,
                "role": role,
                "content": content,
                "week": week,
                "citations": citations or [],
                "referencedImages": referenced_images or [],
                "createdAt": _utcnow(),
            },
        )

    def list_thread_messages(self, thread_id: str, *, limit: int | None = None) -> list[dict[str, Any]]:
        messages = self.find_many({"threadId": thread_id}, limit=limit)
        return sorted(messages, key=lambda item: str(item.get("createdAt") or ""))

    def delete_thread_messages(self, thread_id: str) -> None:
        self.delete_by_filters({"threadId": thread_id})
