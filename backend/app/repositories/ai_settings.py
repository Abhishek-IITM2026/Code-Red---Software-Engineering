from __future__ import annotations

from flask import current_app

from ..document_store.mongo import get_document_store


class AISettingsRepository:
    _PRIMARY_SCOPE = "rag-runtime"
    _LEGACY_SCOPE = "assessment-generation"

    def __init__(self):
        self.store = get_document_store()
        self.collection = current_app.config.get("MONGO_AI_SETTINGS_COLLECTION", "ai_settings")

    def get(self) -> dict | None:
        for scope in (self._PRIMARY_SCOPE, self._LEGACY_SCOPE):
            documents = self.store.find_many(
                self.collection,
                {"scope": scope},
                limit=1,
            )
            if documents:
                return documents[0]
        return None

    def upsert(self, payload: dict) -> dict:
        existing = self.get()
        document = {"scope": self._PRIMARY_SCOPE, **payload}
        if existing is not None and existing.get("_id"):
            document_id = self.store.update_one(self.collection, existing["_id"], document)
        else:
            document_id = self.store.insert_one(self.collection, document)
        return {"_id": document_id, **document}
