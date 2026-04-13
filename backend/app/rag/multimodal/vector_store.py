from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from flask import current_app

from .runtime import cosine_similarity

try:  # pragma: no cover - optional dependency
    import chromadb
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    chromadb = None


TEXT_COLLECTION = "rag_text_chunks"
IMAGE_COLLECTION = "rag_image_embeddings"


def get_vector_backend():
    backend = current_app.extensions.get("rag_vector_backend")
    if backend is not None:
        return backend

    persist_dir = Path(current_app.config.get("RAG_VECTOR_DIR")).resolve()
    persist_dir.mkdir(parents=True, exist_ok=True)

    if chromadb is not None:
        try:  # pragma: no cover - depends on optional dependency
            backend = ChromaVectorBackend(persist_dir)
        except Exception:
            backend = JsonVectorBackend(persist_dir)
    else:
        backend = JsonVectorBackend(persist_dir)

    current_app.extensions["rag_vector_backend"] = backend
    return backend


class ChromaVectorBackend:
    backend_name = "chroma"

    def __init__(self, persist_dir: Path):
        self.client = chromadb.PersistentClient(path=str(persist_dir))  # type: ignore[union-attr]
        self.text_collection = self.client.get_or_create_collection(TEXT_COLLECTION)
        self.image_collection = self.client.get_or_create_collection(IMAGE_COLLECTION)

    def count_text(self) -> int:
        return int(self.text_collection.count())

    def delete_source(self, source_key: str) -> None:
        self.text_collection.delete(where={"source_key": source_key})
        self.image_collection.delete(where={"source_key": source_key})

    def upsert_text_entries(self, entries: list[dict[str, Any]]) -> None:
        if not entries:
            return
        self.text_collection.upsert(
            ids=[entry["vectorId"] for entry in entries],
            embeddings=[entry["embedding"] for entry in entries],
            documents=[entry["document"] for entry in entries],
            metadatas=[entry["metadata"] for entry in entries],
        )

    def upsert_image_entries(self, entries: list[dict[str, Any]]) -> None:
        if not entries:
            return
        self.image_collection.upsert(
            ids=[entry["vectorId"] for entry in entries],
            embeddings=[entry["embedding"] for entry in entries],
            documents=[entry["document"] for entry in entries],
            metadatas=[entry["metadata"] for entry in entries],
        )

    def search_text(self, *, embedding: list[float], where: dict[str, Any] | None, top_k: int) -> list[dict[str, Any]]:
        if self.count_text() == 0:
            return []
        result = self.text_collection.query(
            query_embeddings=[embedding],
            n_results=max(top_k, 1),
            where=where or None,
            include=["documents", "metadatas", "distances"],
        )
        return _coerce_chroma_matches(result)

    def search_images(self, *, embedding: list[float], where: dict[str, Any] | None, top_k: int) -> list[dict[str, Any]]:
        if int(self.image_collection.count()) == 0:
            return []
        result = self.image_collection.query(
            query_embeddings=[embedding],
            n_results=max(top_k, 1),
            where=where or None,
            include=["documents", "metadatas", "distances"],
        )
        return _coerce_chroma_matches(result)


class JsonVectorBackend:
    backend_name = "json"

    def __init__(self, persist_dir: Path):
        self.persist_dir = persist_dir
        self.text_path = persist_dir / f"{TEXT_COLLECTION}.json"
        self.image_path = persist_dir / f"{IMAGE_COLLECTION}.json"

    def count_text(self) -> int:
        return len(self._load(self.text_path))

    def delete_source(self, source_key: str) -> None:
        self._write(
            self.text_path,
            [entry for entry in self._load(self.text_path) if entry.get("metadata", {}).get("source_key") != source_key],
        )
        self._write(
            self.image_path,
            [entry for entry in self._load(self.image_path) if entry.get("metadata", {}).get("source_key") != source_key],
        )

    def upsert_text_entries(self, entries: list[dict[str, Any]]) -> None:
        self._upsert(self.text_path, entries)

    def upsert_image_entries(self, entries: list[dict[str, Any]]) -> None:
        self._upsert(self.image_path, entries)

    def search_text(self, *, embedding: list[float], where: dict[str, Any] | None, top_k: int) -> list[dict[str, Any]]:
        return self._search(self.text_path, embedding=embedding, where=where, top_k=top_k)

    def search_images(self, *, embedding: list[float], where: dict[str, Any] | None, top_k: int) -> list[dict[str, Any]]:
        return self._search(self.image_path, embedding=embedding, where=where, top_k=top_k)

    def _upsert(self, path: Path, entries: list[dict[str, Any]]) -> None:
        existing = {entry["vectorId"]: entry for entry in self._load(path)}
        for entry in entries:
            existing[entry["vectorId"]] = entry
        self._write(path, list(existing.values()))

    def _search(self, path: Path, *, embedding: list[float], where: dict[str, Any] | None, top_k: int) -> list[dict[str, Any]]:
        matches = []
        for entry in self._load(path):
            metadata = entry.get("metadata") or {}
            if where and not all(metadata.get(key) == value for key, value in where.items()):
                continue
            matches.append(
                {
                    "document": entry.get("document"),
                    "metadata": metadata,
                    "score": cosine_similarity(embedding, entry.get("embedding") or []),
                }
            )
        matches.sort(key=lambda item: item.get("score", 0.0), reverse=True)
        return matches[: max(top_k, 1)]

    def _load(self, path: Path) -> list[dict[str, Any]]:
        if not path.exists():
            return []
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return []

    def _write(self, path: Path, payload: list[dict[str, Any]]) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload), encoding="utf-8")


def _coerce_chroma_matches(raw: dict[str, Any]) -> list[dict[str, Any]]:
    documents = (raw.get("documents") or [[]])[0]
    metadatas = (raw.get("metadatas") or [[]])[0]
    distances = (raw.get("distances") or [[]])[0]
    matches: list[dict[str, Any]] = []
    for document, metadata, distance in zip(documents, metadatas, distances):
        score = 1.0 - float(distance or 0.0)
        matches.append({"document": document, "metadata": metadata or {}, "score": score})
    return matches
