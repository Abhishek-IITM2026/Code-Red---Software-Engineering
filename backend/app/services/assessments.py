from __future__ import annotations

from typing import Any

from ..extensions import db
from ..models import Assessment
from ..repositories import AssessmentQuestionRepository


def serialize_assessment(assessment: Assessment) -> dict[str, Any]:
    questions = AssessmentQuestionRepository().get_questions(
        assessment.questions_document_id,
        fallback=assessment.questions_json,
    )
    return assessment.to_dict(questions=questions)


def create_assessment_with_questions(payload: dict[str, Any]) -> Assessment:
    assessment = Assessment(
        title=payload["title"],
        description=payload.get("description"),
        class_id=int(payload["classId"]),
        subject_id=int(payload["subjectId"]),
        total_marks=int(payload["totalMarks"]),
        created_by=int(payload.get("createdBy", 2)),
        due_date=payload.get("dueDate"),
        published=bool(payload.get("published", False)),
        questions_json=payload.get("questions", []),
    )
    db.session.add(assessment)
    db.session.flush()

    repository = AssessmentQuestionRepository()
    assessment.questions_document_id = repository.create(assessment.id, assessment.questions_json)

    db.session.commit()
    return assessment


def update_assessment_questions(assessment: Assessment, questions: list[dict[str, Any]]) -> Assessment:
    assessment.questions_json = questions
    assessment.questions_document_id = AssessmentQuestionRepository().update(
        assessment.questions_document_id,
        assessment.id,
        questions,
    )
    db.session.commit()
    return assessment


def delete_assessment_questions(assessment: Assessment) -> None:
    AssessmentQuestionRepository().delete(assessment.questions_document_id)
