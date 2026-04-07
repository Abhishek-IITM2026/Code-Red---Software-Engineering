from __future__ import annotations

from typing import Any

from ..api.errors import ApiError
from ..extensions import db
from ..models import Assessment, AssessmentSubmission, Subject
from ..rag.assessment import generate_grounded_questions
from ..repositories import AssessmentQuestionRepository, AssessmentSubmissionRepository
from .ai_settings import get_ai_settings
from .materials import get_materials_for_generation


def serialize_assessment(assessment: Assessment) -> dict[str, Any]:
    questions = AssessmentQuestionRepository().get_questions(
        assessment.questions_document_id,
        fallback=assessment.questions_json,
    )
    return assessment.to_dict(questions=questions)


def serialize_assessment_for_student(assessment: Assessment) -> dict[str, Any]:
    serialized = serialize_assessment(assessment)
    sanitized_questions = []
    for question in serialized["questions"]:
        sanitized_question = dict(question)
        sanitized_question.pop("correctAnswer", None)
        sanitized_questions.append(sanitized_question)
    serialized["questions"] = sanitized_questions
    return serialized


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


def _normalize_answer(answer: Any):
    if isinstance(answer, list):
        return [str(item).strip() for item in answer]
    if answer is None:
        return ""
    return str(answer).strip()


def evaluate_submission(questions: list[dict[str, Any]], answers: list[dict[str, Any]]) -> tuple[float, float, list[dict[str, Any]]]:
    answer_map = {answer["questionId"]: _normalize_answer(answer.get("answer")) for answer in answers}
    total_score = 0.0
    evaluated_answers = []
    total_marks = sum(float(question.get("marks", 0)) for question in questions)

    for question in questions:
        submitted_answer = answer_map.get(question.get("id"), "")
        correct_answer = _normalize_answer(question.get("correctAnswer"))
        awarded_marks = 0.0
        if question.get("questionType") in {"mcq", "trueFalse"}:
            if submitted_answer == correct_answer:
                awarded_marks = float(question.get("marks", 0))
        evaluated_answers.append(
            {
                "questionId": question.get("id"),
                "submittedAnswer": submitted_answer,
                "correctAnswer": correct_answer,
                "awardedMarks": awarded_marks,
            }
        )
        total_score += awarded_marks

    return total_score, total_marks, evaluated_answers


def serialize_assessment_submission(submission: AssessmentSubmission) -> dict[str, Any]:
    payload = AssessmentSubmissionRepository().get_submission(submission.answers_document_id, fallback={})
    return submission.to_dict(answers=payload.get("answers", []))


def generate_assessment_questions(payload: dict[str, Any]) -> list[dict[str, Any]]:
    subject = db.session.get(Subject, int(payload["subjectId"]))
    if subject is None:
        raise ApiError(404, "COURSE_NOT_FOUND", "Course was not found for question generation.")

    materials = get_materials_for_generation(
        subject_id=subject.id,
        selected_materials=payload.get("materials") or [],
    )
    if not materials:
        raise ApiError(
            422,
            "MATERIALS_REQUIRED",
            "Add at least one study material for this course before generating assessment questions.",
        )

    return generate_grounded_questions(
        subject_name=subject.name,
        materials=materials,
        question_count=max(1, int(payload.get("questionCount", 1))),
        total_marks=max(1, int(payload.get("totalMarks", 1))),
        difficulty_level=payload.get("difficultyLevel", "medium"),
        question_types=payload.get("questionTypes") or {},
        custom_prompt=payload.get("customPrompt"),
        ai_settings=get_ai_settings(include_secret=True),
    )
