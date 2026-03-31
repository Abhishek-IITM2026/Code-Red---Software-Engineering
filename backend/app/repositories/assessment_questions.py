from __future__ import annotations

from typing import Any

from flask import current_app

from ..document_store import get_document_store


class AssessmentQuestionRepository:
    def __init__(self):
        self.store = get_document_store()
        self.collection = current_app.config["MONGO_ASSESSMENT_COLLECTION"]

    def create(self, assessment_id: int | None, questions: list[dict[str, Any]]) -> str:
        return self.store.insert_one(
            self.collection,
            {"assessmentId": str(assessment_id) if assessment_id is not None else None, "questions": questions},
        )

    def get_questions(self, document_id: str | None, fallback: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
        document = self.store.find_one(self.collection, document_id)
        if document is None:
            return fallback or []
        return document.get("questions", [])

    def update(self, document_id: str | None, assessment_id: int, questions: list[dict[str, Any]]) -> str:
        payload = {"assessmentId": str(assessment_id), "questions": questions}
        if document_id:
            return self.store.update_one(self.collection, document_id, payload)
        return self.create(assessment_id, questions)

    def delete(self, document_id: str | None) -> None:
        self.store.delete_one(self.collection, document_id)
