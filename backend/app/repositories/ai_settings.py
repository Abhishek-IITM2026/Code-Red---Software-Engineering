from __future__ import annotations

from flask import current_app

from ..document_store.mongo import get_document_store


class AISettingsRepository:
    _SCOPE = "assessment-generation"

    def __init__(self):
        self.store = get_document_store()
        self.collection = current_app.config.get("MONGO_AI_SETTINGS_COLLECTION", "ai_settings")

    def get(self) -> dict | None:
        documents = self.store.find_many(
            self.collection,
            {"scope": self._SCOPE},
            limit=1,
        )
        return documents[0] if documents else None

    def upsert(self, payload: dict) -> dict:
        existing = self.get()
        document = {"scope": self._SCOPE, **payload}
        if existing is not None and existing.get("_id"):
            document_id = self.store.update_one(self.collection, existing["_id"], document)
        else:
            document_id = self.store.insert_one(self.collection, document)
        return {"_id": document_id, **document}
