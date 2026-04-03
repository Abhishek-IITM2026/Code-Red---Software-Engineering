from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4

from flask import current_app

try:
    from pymongo import MongoClient
except ModuleNotFoundError:  # pragma: no cover - depends on installed extras
    MongoClient = None

try:
    from bson import ObjectId
except ModuleNotFoundError:  # pragma: no cover - depends on installed extras
    ObjectId = None


@dataclass
class InMemoryDocumentStore:
    collections: dict[str, dict[str, dict[str, Any]]] = field(default_factory=dict)

    def _collection(self, name: str) -> dict[str, dict[str, Any]]:
        return self.collections.setdefault(name, {})

    def insert_one(self, collection: str, payload: dict[str, Any]) -> str:
        document_id = str(uuid4())
        self._collection(collection)[document_id] = {"_id": document_id, **payload}
        return document_id

    def find_one(self, collection: str, document_id: str | None) -> dict[str, Any] | None:
        if not document_id:
            return None
        return self._collection(collection).get(document_id)

    def update_one(self, collection: str, document_id: str, payload: dict[str, Any]) -> str:
        self._collection(collection)[document_id] = {"_id": document_id, **payload}
        return document_id

    def delete_one(self, collection: str, document_id: str | None) -> None:
        if document_id:
            self._collection(collection).pop(document_id, None)


class MongoDocumentStore:
    def __init__(self, mongo_uri: str, db_name: str):
        self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
        self.database = self.client[db_name]

    @staticmethod
    def _normalize_id(document_id: str):
        if ObjectId is None:
            return document_id
        try:
            return ObjectId(document_id)
        except Exception:
            return document_id

    def insert_one(self, collection: str, payload: dict[str, Any]) -> str:
        result = self.database[collection].insert_one(payload)
        return str(result.inserted_id)

    def find_one(self, collection: str, document_id: str | None) -> dict[str, Any] | None:
        if not document_id:
            return None
        document = self.database[collection].find_one({"_id": self._normalize_id(document_id)})
        if document is None:
            return None
        document["_id"] = str(document["_id"])
        return document

    def update_one(self, collection: str, document_id: str, payload: dict[str, Any]) -> str:
        self.database[collection].update_one({"_id": self._normalize_id(document_id)}, {"$set": payload}, upsert=True)
        return document_id

    def delete_one(self, collection: str, document_id: str | None) -> None:
        if document_id:
            self.database[collection].delete_one({"_id": self._normalize_id(document_id)})


class ResilientDocumentStore:
    def __init__(self, primary, fallback):
        self.primary = primary
        self.fallback = fallback

    def _call(self, method_name: str, *args, **kwargs):
        primary_method = getattr(self.primary, method_name)
        fallback_method = getattr(self.fallback, method_name)
        try:
            return primary_method(*args, **kwargs)
        except Exception as exc:  # pragma: no cover - depends on runtime infra
            current_app.logger.warning("Document store primary backend unavailable, using fallback store. Reason: %s", exc)
            return fallback_method(*args, **kwargs)

    def insert_one(self, collection: str, payload: dict[str, Any]) -> str:
        return self._call("insert_one", collection, payload)

    def find_one(self, collection: str, document_id: str | None) -> dict[str, Any] | None:
        return self._call("find_one", collection, document_id)

    def update_one(self, collection: str, document_id: str, payload: dict[str, Any]) -> str:
        return self._call("update_one", collection, document_id, payload)

    def delete_one(self, collection: str, document_id: str | None) -> None:
        self._call("delete_one", collection, document_id)


def init_document_store(app) -> None:
    use_mock = app.config.get("USE_MONGO_MOCK", False) or MongoClient is None
    if use_mock:
        app.extensions["document_store"] = InMemoryDocumentStore()
        app.extensions["document_store_status"] = {
            "backend": "in-memory",
            "connected": False,
            "dbName": app.config.get("MONGO_DB_NAME"),
            "reason": "Mock mode is enabled." if app.config.get("USE_MONGO_MOCK", False) else "pymongo is not installed.",
        }
        return

    fallback = InMemoryDocumentStore()
    try:
        primary = MongoDocumentStore(
            mongo_uri=app.config["MONGO_URI"],
            db_name=app.config["MONGO_DB_NAME"],
        )
        primary.client.admin.command("ping")
        app.extensions["document_store"] = ResilientDocumentStore(primary, fallback)
        app.extensions["document_store_status"] = {
            "backend": "mongo",
            "connected": True,
            "dbName": primary.database.name,
            "reason": None,
        }
    except Exception as exc:  # pragma: no cover - depends on runtime infra
        app.logger.warning("MongoDB unavailable during startup, using in-memory document store fallback. Reason: %s", exc)
        app.extensions["document_store"] = fallback
        app.extensions["document_store_status"] = {
            "backend": "in-memory",
            "connected": False,
            "dbName": app.config.get("MONGO_DB_NAME"),
            "reason": str(exc),
        }


def get_document_store():
    return current_app.extensions["document_store"]
