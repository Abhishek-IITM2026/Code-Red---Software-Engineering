from __future__ import annotations

from typing import Any

from flask import current_app

from ..api.errors import ApiError
from ..extensions import db
from ..models import Assessment, AssessmentSubmission, Subject
from ..rag.assessment import generate_grounded_questions
from ..rag.assessment.llm import try_modify_llm_questions
from ..rag.llm_clients import SUPPORTED_EXTERNAL_PROVIDERS
from ..rag.multimodal import build_question_context, derive_material_scope, ensure_material_sources_ready, retrieve_context
from ..rag.multimodal.runtime import normalize_week_label
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
        week=payload.get("week"),
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

    requested_question_count = max(1, int(payload.get("questionCount", 1)))
    question_types = payload.get("questionTypes") or {}
    typed_distribution_count = sum(max(int(value or 0), 0) for value in question_types.values())
    effective_question_count = typed_distribution_count if typed_distribution_count > 0 else requested_question_count
    material_scope = derive_material_scope(materials)
    requested_week = str(payload.get("week") or "").strip() or None
    normalized_week = normalize_week_label(requested_week) if requested_week else None
    ai_settings = get_ai_settings(include_secret=True)
    material_ids = [str(item.get("id")) for item in materials if item.get("id") is not None]

    # Ensure selected materials are indexed in the vector store before retrieval.
    # Without this, retrieve_context() hits an empty index and falls back to
    # hardcoded template questions instead of using the faculty-uploaded content.
    try:
        ensure_material_sources_ready(materials, triggered_by="assessment-generation")
    except Exception:
        current_app.logger.exception(
            "Assessment generation failed while preparing material sources",
            extra={
                "subject": subject.name,
                "week": normalized_week,
                "materialIds": material_ids,
                "provider": str(ai_settings.get("provider") or "grounded-rag"),
                "stage": "ensure-material-sources",
            },
        )

    retrieval = {}
    retrieved_chunks: list[dict[str, Any]] | None = None
    try:
        retrieval = retrieve_context(
            query=" ".join(
                item
                for item in [
                    subject.name,
                    payload.get("questionStyle"),
                    payload.get("customPrompt"),
                ]
                if item
            ),
            subject=subject.name,
            week=normalized_week,
            allowed_source_files=material_scope["sourceFiles"] or None,
            allowed_weeks=material_scope["weeks"] or None,
            top_k_text=max(effective_question_count, 4),
        )
        retrieved_chunks = build_question_context(payload.get("customPrompt") or subject.name, retrieval.get("textMatches") or [])
    except Exception:
        current_app.logger.exception(
            "Assessment generation retrieval failed",
            extra={
                "subject": subject.name,
                "week": normalized_week,
                "materialIds": material_ids,
                "provider": str(ai_settings.get("provider") or "grounded-rag"),
                "stage": "retrieve-context",
            },
        )

    try:
        return generate_grounded_questions(
            subject_name=subject.name,
            materials=materials,
            question_count=effective_question_count,
            total_marks=max(1, int(payload.get("totalMarks", 1))),
            difficulty_level=payload.get("difficultyLevel", "medium"),
            question_types=question_types,
            custom_prompt=payload.get("customPrompt"),
            question_style=payload.get("questionStyle"),
            retrieved_chunks=retrieved_chunks or None,
            ai_settings=ai_settings,
        )
    except ApiError:
        raise
    except Exception as exc:
        current_app.logger.exception(
            "Assessment generation failed during question assembly",
            extra={
                "subject": subject.name,
                "week": normalized_week,
                "materialIds": material_ids,
                "provider": str(ai_settings.get("provider") or "grounded-rag"),
                "retrievedTextMatches": len(retrieval.get("textMatches") or []),
                "stage": "assemble-questions",
            },
        )
        raise ApiError(
            503,
            "QUESTION_GENERATION_FAILED",
            "Question generation could not be completed with the selected materials right now.",
            {
                "reason": str(exc),
            },
        ) from exc


def modify_assessment_questions(
    *,
    questions: list[dict[str, Any]],
    modification_prompt: str,
    subject_id: int | None = None,
    subject_name: str | None = None,
    week: str | None = None,
    materials: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    ai_settings = get_ai_settings(include_secret=True)

    # Build retrieval context from materials so modifications are grounded in content
    retrieved_chunks: list[dict[str, Any]] | None = None
    if materials and subject_name:
        material_scope = derive_material_scope(materials)
        normalized_week = normalize_week_label(week) if week else None
        ensure_material_sources_ready(materials, triggered_by="assessment-modification")
        retrieval = retrieve_context(
            query=subject_name,
            subject=subject_name,
            week=normalized_week,
            allowed_source_files=material_scope["sourceFiles"] or None,
            allowed_weeks=material_scope["weeks"] or None,
            top_k_text=4,
        )
        retrieved_chunks = (
            build_question_context(subject_name, retrieval.get("textMatches") or [])
            if retrieval.get("textMatches")
            else None
        )

    updated = try_modify_llm_questions(
        questions=questions,
        modification_prompt=modification_prompt,
        subject_name=subject_name,
        retrieved_chunks=retrieved_chunks,
        ai_settings=ai_settings,
    )
    if updated:
        return updated

    provider = str(ai_settings.get("provider") or "grounded-rag").strip().lower()
    if provider in SUPPORTED_EXTERNAL_PROVIDERS and not ai_settings.get("fallbackToGroundedRag", True):
        raise ApiError(
            503,
            "AI_PROVIDER_UNAVAILABLE",
            "The configured AI provider did not return usable modified questions and fallback is disabled.",
        )

    return _heuristic_modify_questions(questions, modification_prompt)


def _heuristic_modify_questions(
    questions: list[dict[str, Any]],
    modification_prompt: str,
) -> list[dict[str, Any]]:
    prompt = (modification_prompt or "").strip().lower()
    force_hard = any(token in prompt for token in ["hard", "challenging", "advanced", "difficult"])
    force_easy = any(token in prompt for token in ["easy", "easier", "simpl", "beginner", "basic"])
    prefer_mcq = "mcq" in prompt or "multiple choice" in prompt
    prefer_short = "short" in prompt
    prefer_long = "long" in prompt or "descriptive" in prompt
    include_numerical = "numerical" in prompt or "calculation" in prompt

    updated_questions: list[dict[str, Any]] = []
    for question in questions:
        next_question = dict(question)
        question_text = str(next_question.get("questionText") or "").strip()
        question_type = str(next_question.get("questionType") or "short").strip()

        if prefer_mcq and question_type != "mcq":
            question_type = "mcq"
        elif prefer_long and question_type in {"mcq", "trueFalse"}:
            question_type = "long"
        elif prefer_short and question_type == "long":
            question_type = "short"

        if include_numerical and "calculate" not in question_text.lower():
            question_text = f"{question_text} Include a calculation or numerical justification.".strip()

        if force_hard:
            next_question["difficulty"] = "hard"
            next_question["marks"] = max(int(next_question.get("marks") or 1), 2)
        elif force_easy:
            next_question["difficulty"] = "easy"
            next_question["marks"] = max(1, int(next_question.get("marks") or 1))

        next_question["questionType"] = question_type
        next_question["questionText"] = question_text

        if question_type == "mcq":
            options = next_question.get("options")
            normalized_options = [str(item).strip() for item in (options or []) if str(item).strip()]
            if len(normalized_options) < 2:
                normalized_options = ["Option A", "Option B", "Option C", "Option D"]
            next_question["options"] = normalized_options[:4]
            correct = str(next_question.get("correctAnswer") or "").strip()
            next_question["correctAnswer"] = correct if correct in next_question["options"] else next_question["options"][0]
        elif question_type == "trueFalse":
            next_question["options"] = ["True", "False"]
            normalized_answer = str(next_question.get("correctAnswer") or "").strip().lower()
            next_question["correctAnswer"] = "False" if normalized_answer == "false" else "True"
        else:
            next_question["options"] = None

        updated_questions.append(next_question)

    return updated_questions
