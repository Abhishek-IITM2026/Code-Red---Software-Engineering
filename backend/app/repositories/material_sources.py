from __future__ import annotations

from typing import Any

from flask import current_app

from ..document_store import get_document_store


class MaterialSourceRepository:
    def __init__(self):
        self.store = get_document_store()
        self.collection = current_app.config.get("MONGO_MATERIAL_SOURCE_COLLECTION", "material_sources")

    def create(self, material_id: int, payload: dict[str, Any]) -> str:
        return self.store.insert_one(
            self.collection,
            {"materialId": str(material_id), **payload},
        )

    def get_by_material(self, material_id: int) -> dict[str, Any] | None:
        documents = self.store.find_many(self.collection, {"materialId": str(material_id)}, limit=1)
        return documents[0] if documents else None

    def get_by_storage_path(self, storage_path: str) -> dict[str, Any] | None:
        documents = self.store.find_many(self.collection, {"storagePath": storage_path}, limit=1)
        return documents[0] if documents else None

    def upsert(self, material_id: int, payload: dict[str, Any]) -> str:
        existing = self.get_by_material(material_id)
        document_payload = {"materialId": str(material_id), **payload}
        if existing and existing.get("_id"):
            return self.store.update_one(self.collection, existing["_id"], document_payload)
        return self.create(material_id, payload)

    def delete_by_material(self, material_id: int) -> None:
        existing = self.get_by_material(material_id)
        if existing and existing.get("_id"):
            self.store.delete_one(self.collection, existing["_id"])
