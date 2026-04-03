from __future__ import annotations

from typing import Any

from flask import current_app

from ..document_store import get_document_store


class AssessmentSubmissionRepository:
    def __init__(self):
        self.store = get_document_store()
        self.collection = current_app.config.get("MONGO_ASSESSMENT_SUBMISSION_COLLECTION", "assessment_submissions")

    def create(self, assessment_submission_id: int | None, payload: dict[str, Any]) -> str:
        return self.store.insert_one(
            self.collection,
            {"assessmentSubmissionId": str(assessment_submission_id) if assessment_submission_id is not None else None, **payload},
        )

    def get_submission(self, document_id: str | None, fallback: dict[str, Any] | None = None) -> dict[str, Any]:
        document = self.store.find_one(self.collection, document_id)
        if document is None:
            return fallback or {}
        return document

    def update(self, document_id: str | None, assessment_submission_id: int, payload: dict[str, Any]) -> str:
        document_payload = {"assessmentSubmissionId": str(assessment_submission_id), **payload}
        if document_id:
            return self.store.update_one(self.collection, document_id, document_payload)
        return self.create(assessment_submission_id, document_payload)

    def delete(self, document_id: str | None) -> None:
        self.store.delete_one(self.collection, document_id)
