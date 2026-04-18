from __future__ import annotations

import json
from typing import Any

from flask import current_app

from ..llm_clients import (
    EXTERNAL_PROVIDER_ERRORS,
    SUPPORTED_EXTERNAL_PROVIDERS,
    extract_text_content,
    post_external_chat_completion,
    resolve_external_runtime,
)
from .retrieval import build_question_type_plan, distribute_marks, rank_chunks, summarize_text


def try_generate_llm_grounded_questions(
    *,
    subject_name: str,
    chunks: list[dict[str, Any]],
    question_count: int,
    total_marks: int,
    difficulty_level: str,
    question_types: dict[str, int],
    custom_prompt: str | None,
    question_style: str | None,
    ai_settings: dict[str, Any] | None,
) -> list[dict[str, Any]] | None:
    settings = ai_settings or {}
    provider, base_url, model, api_key, _mode = resolve_external_runtime(settings)
    if provider not in SUPPORTED_EXTERNAL_PROVIDERS:
        return None

    if not model or not chunks:
        return None

    marks_plan = distribute_marks(total_marks=max(int(total_marks or 1), 1), count=max(int(question_count or 1), 1))
    question_type_plan = build_question_type_plan(question_types, len(marks_plan))
    ranked_chunks = rank_chunks(
        chunks,
        subject_name=subject_name,
        custom_prompt=custom_prompt,
        question_type="mixed",
        max_chunks=min(max(len(marks_plan), 3), max(len(chunks), 1)),
    )

    prompt_payload = {
        "subject": subject_name,
        "difficulty": difficulty_level,
        "questionCount": len(marks_plan),
        "marksPlan": marks_plan,
        "questionTypePlan": question_type_plan,
        "questionStyle": question_style or "mixed",
        "customPrompt": custom_prompt or "",
        "context": [
            {
                "materialId": chunk.get("materialId"),
                "materialTitle": chunk.get("materialTitle"),
                "unit": chunk.get("unit"),
                "week": chunk.get("week"),
                "imageUrls": chunk.get("imageUrls") or [],
                "text": chunk.get("text"),
            }
            for chunk in ranked_chunks
        ],
    }
    prompt = (
        "Create grounded assessment questions strictly from the supplied course context. "
        "Return valid JSON only. Use this schema: "
        '[{"questionText":"...","questionType":"mcq|short|long|trueFalse","options":["..."],'
        '"correctAnswer":"...","marks":5,"difficulty":"easy|medium|hard","imageUrls":["..."],'
        '"contextSnippet":"...","sourceMaterialIds":["1"],"sourceMaterialTitles":["Unit 1 Notes"]}]'
        "\nDo not include markdown fences or extra commentary.\n"
        f"{json.dumps(prompt_payload, ensure_ascii=True)}"
    )

    system_prompt = str(settings.get("assessmentSystemPrompt") or "").strip() or (
        "You are an expert academic assessment creator specializing in generating high-quality, pedagogically sound exam questions. "
        "Your questions must: (1) be grounded strictly in the provided course context, (2) be clear, unambiguous, and free of typos, "
        "(3) match the specified difficulty level with appropriate cognitive complexity, (4) test meaningful concepts rather than trivial recall, "
        "(5) have correct answers with complete justification, and (6) maintain academic rigor. "
        "Ensure options in multiple choice are plausible but clearly distinguishable. Return only valid JSON without markdown formatting or commentary."
    )
    
    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=float(settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(settings.get("maxTokens", 1200) or 1200),
        )
    except EXTERNAL_PROVIDER_ERRORS as exc:
        current_app.logger.warning(
            "Assessment LLM question generation provider request failed",
            extra={
                "provider": provider,
                "model": model,
                "subject": subject_name,
                "questionCount": question_count,
            },
        )
        current_app.logger.debug("Assessment LLM provider exception: %s", exc)
        return None

    raw_content = extract_text_content(provider, response_payload)
    if not raw_content:
        current_app.logger.warning(
            "Assessment LLM question generation returned no text content",
            extra={"provider": provider, "model": model, "subject": subject_name},
        )
        return None

    parsed_questions = _parse_json_questions(raw_content)
    if not parsed_questions:
        current_app.logger.warning(
            "Assessment LLM question generation returned unparseable JSON",
            extra={"provider": provider, "model": model, "subject": subject_name},
        )
        return None

    try:
        return _normalize_question_payloads(
            parsed_questions,
            marks_plan=marks_plan,
            question_type_plan=question_type_plan,
            difficulty_level=difficulty_level,
            ranked_chunks=ranked_chunks,
        )
    except Exception:
        current_app.logger.exception(
            "Assessment LLM question generation normalization failed",
            extra={"provider": provider, "model": model, "subject": subject_name},
        )
        return None


def try_modify_llm_questions(
    *,
    questions: list[dict[str, Any]],
    modification_prompt: str,
    subject_name: str | None = None,
    retrieved_chunks: list[dict[str, Any]] | None = None,
    ai_settings: dict[str, Any] | None = None,
) -> list[dict[str, Any]] | None:
    settings = ai_settings or {}
    provider, base_url, model, api_key, _mode = resolve_external_runtime(settings)
    if provider not in SUPPORTED_EXTERNAL_PROVIDERS:
        return None
    if not model or not questions:
        return None

    prompt_payload = {
        "modificationPrompt": modification_prompt,
        "subject": subject_name,
        "questions": [
            {
                "id": str(question.get("id") or ""),
                "questionText": str(question.get("questionText") or ""),
                "questionType": str(question.get("questionType") or "short"),
                "options": question.get("options"),
                "correctAnswer": question.get("correctAnswer"),
                "marks": question.get("marks"),
                "difficulty": question.get("difficulty"),
                "imageUrls": question.get("imageUrls"),
                "contextSnippet": question.get("contextSnippet"),
                "sourceMaterialIds": question.get("sourceMaterialIds"),
                "sourceMaterialTitles": question.get("sourceMaterialTitles"),
            }
            for question in questions
        ],
    }
    # Include relevant material chunks so the LLM can ground modifications in the actual content
    if retrieved_chunks:
        prompt_payload["context"] = [
            {
                "materialId": chunk.get("materialId"),
                "materialTitle": chunk.get("materialTitle"),
                "week": chunk.get("week"),
                "imageUrls": chunk.get("imageUrls") or [],
                "text": chunk.get("text"),
            }
            for chunk in retrieved_chunks
        ]
    prompt = (
        "Modify the assessment questions based on the provided instruction. "
        "When material context is provided, use it to ensure modifications are consistent with the study content. "
        "Preserve the question count unless the instruction explicitly asks to add or remove questions. "
        "Keep marks reasonable and ensure questionType is one of mcq|short|long|trueFalse. "
        "Return valid JSON only using this schema: "
        '[{"id":"...","questionText":"...","questionType":"mcq|short|long|trueFalse",'
        '"options":["..."],"correctAnswer":"...","marks":5,"difficulty":"easy|medium|hard",'
        '"imageUrls":["..."],"contextSnippet":"...","sourceMaterialIds":["1"],"sourceMaterialTitles":["Notes"]}]'
        "\nDo not include markdown fences or extra commentary.\n"
        f"{json.dumps(prompt_payload, ensure_ascii=True)}"
    )

    system_prompt = str(settings.get("assessmentModifySystemPrompt") or "").strip() or (
        "You are an expert academic assessment editor. When modifying assessment questions: (1) preserve the pedagogical intent and difficulty level, "
        "(2) maintain strict grounding in the provided course context, (3) ensure all changes improve clarity without reducing rigor, "
        "(4) verify that correct answers remain accurate and complete, (5) check that question stems are grammatically correct and unambiguous, "
        "(6) ensure options are appropriately calibrated to the difficulty level. "
        "Return only valid JSON without markdown formatting or commentary."
    )
    
    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=float(settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(settings.get("maxTokens", 1200) or 1200),
        )
    except EXTERNAL_PROVIDER_ERRORS as exc:
        current_app.logger.warning(
            "Assessment LLM modification provider request failed",
            extra={"provider": provider, "model": model, "subject": subject_name},
        )
        current_app.logger.debug("Assessment LLM modification provider exception: %s", exc)
        return None

    raw_content = extract_text_content(provider, response_payload)
    if not raw_content:
        current_app.logger.warning(
            "Assessment LLM modification returned no text content",
            extra={"provider": provider, "model": model, "subject": subject_name},
        )
        return None

    parsed_questions = _parse_json_questions(raw_content)
    if not parsed_questions:
        current_app.logger.warning(
            "Assessment LLM modification returned unparseable JSON",
            extra={"provider": provider, "model": model, "subject": subject_name},
        )
        return None

    try:
        return _normalize_modified_questions(parsed_questions, questions)
    except Exception:
        current_app.logger.exception(
            "Assessment LLM modification normalization failed",
            extra={"provider": provider, "model": model, "subject": subject_name},
        )
        return None

def _parse_json_questions(raw_content: str) -> list[dict[str, Any]] | None:
    cleaned = raw_content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

    for candidate in (cleaned, _extract_json_candidate(cleaned, "[" , "]"), _extract_json_candidate(cleaned, "{", "}")):
        if not candidate:
            continue
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict) and isinstance(parsed.get("questions"), list):
            return [item for item in parsed["questions"] if isinstance(item, dict)]
        if isinstance(parsed, list):
            return [item for item in parsed if isinstance(item, dict)]
    return None


def _extract_json_candidate(content: str, start_char: str, end_char: str) -> str | None:
    start = content.find(start_char)
    end = content.rfind(end_char)
    if start == -1 or end == -1 or end <= start:
        return None
    return content[start : end + 1]


def _normalize_question_payloads(
    parsed_questions: list[dict[str, Any]],
    *,
    marks_plan: list[int],
    question_type_plan: list[str],
    difficulty_level: str,
    ranked_chunks: list[dict[str, Any]],
) -> list[dict[str, Any]] | None:
    if not parsed_questions:
        return None

    normalized: list[dict[str, Any]] = []
    for index, marks in enumerate(marks_plan):
        source = parsed_questions[index] if index < len(parsed_questions) else {}
        chunk = ranked_chunks[index % len(ranked_chunks)]
        question_type = _normalize_question_type(source.get("questionType") or question_type_plan[index])
        difficulty = _normalize_difficulty(source.get("difficulty"), fallback=difficulty_level)
        image_urls = _normalize_string_list(source.get("imageUrls")) or (chunk.get("imageUrls") or [])
        source_material_ids = _normalize_string_list(source.get("sourceMaterialIds")) or ([chunk.get("materialId")] if chunk.get("materialId") else [])
        source_material_titles = _normalize_string_list(source.get("sourceMaterialTitles")) or ([chunk.get("materialTitle")] if chunk.get("materialTitle") else [])
        options = _normalize_string_list(source.get("options")) if question_type in {"mcq", "trueFalse"} else None
        if question_type == "trueFalse":
            options = ["True", "False"]

        normalized.append(
            {
                "id": f"rag-{index + 1}",
                "questionText": str(source.get("questionText") or source.get("question") or f"Question {index + 1}"),
                "questionType": question_type,
                "options": options,
                "correctAnswer": source.get("correctAnswer"),
                "marks": int(source.get("marks") or marks),
                "difficulty": difficulty,
                "imageUrls": image_urls or None,
                "contextSnippet": str(source.get("contextSnippet") or summarize_text(chunk.get("text") or "", max_words=50)),
                "sourceMaterialIds": source_material_ids,
                "sourceMaterialTitles": source_material_titles,
            }
        )

    return normalized


def _normalize_modified_questions(
    parsed_questions: list[dict[str, Any]],
    original_questions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    total = max(len(original_questions), len(parsed_questions))

    for index in range(total):
        source = parsed_questions[index] if index < len(parsed_questions) else {}
        original = original_questions[index] if index < len(original_questions) else {}

        original_type = _normalize_question_type(original.get("questionType"))
        question_type = _normalize_question_type(source.get("questionType") or original_type)
        fallback_difficulty = str(original.get("difficulty") or "medium")
        difficulty = _normalize_difficulty(source.get("difficulty"), fallback=fallback_difficulty)
        marks = max(1, int(source.get("marks") or original.get("marks") or 1))

        options = _normalize_string_list(source.get("options"))
        if question_type == "trueFalse":
            options = ["True", "False"]
        elif question_type == "mcq":
            if len(options) < 2:
                options = _normalize_string_list(original.get("options"))
            if len(options) < 2:
                options = ["Option A", "Option B", "Option C", "Option D"]
        else:
            options = []

        correct_answer = source.get("correctAnswer", original.get("correctAnswer"))
        if question_type == "trueFalse":
            normalized_answer = str(correct_answer or "").strip().lower()
            correct_answer = "False" if normalized_answer == "false" else "True"
        elif question_type == "mcq":
            if isinstance(correct_answer, list):
                correct_answer = next((str(item).strip() for item in correct_answer if str(item).strip()), "")
            correct_answer = str(correct_answer or "").strip()
            if not correct_answer or correct_answer not in options:
                correct_answer = options[0]
        elif isinstance(correct_answer, list):
            correct_answer = [str(item).strip() for item in correct_answer if str(item).strip()]
        elif correct_answer is not None:
            correct_answer = str(correct_answer).strip()

        image_urls = _normalize_string_list(source.get("imageUrls")) or _normalize_string_list(original.get("imageUrls"))
        source_material_ids = _normalize_string_list(source.get("sourceMaterialIds")) or _normalize_string_list(
            original.get("sourceMaterialIds")
        )
        source_material_titles = _normalize_string_list(source.get("sourceMaterialTitles")) or _normalize_string_list(
            original.get("sourceMaterialTitles")
        )

        question_text = str(
            source.get("questionText")
            or source.get("question")
            or original.get("questionText")
            or f"Question {index + 1}"
        ).strip()
        context_snippet = str(source.get("contextSnippet") or original.get("contextSnippet") or "").strip()

        normalized.append(
            {
                "id": str(original.get("id") or source.get("id") or f"rag-{index + 1}"),
                "questionText": question_text,
                "questionType": question_type,
                "options": options or None,
                "correctAnswer": correct_answer,
                "marks": marks,
                "difficulty": difficulty,
                "imageUrls": image_urls or None,
                "contextSnippet": context_snippet or None,
                "sourceMaterialIds": source_material_ids or None,
                "sourceMaterialTitles": source_material_titles or None,
            }
        )

    return normalized


def _normalize_question_type(value: Any) -> str:
    normalized = str(value or "short").strip().lower()
    if normalized in {"mcq", "short", "long", "truefalse", "true_false"}:
        return "trueFalse" if normalized in {"truefalse", "true_false"} else normalized
    return "short"


def _normalize_difficulty(value: Any, *, fallback: str) -> str:
    normalized = str(value or "").strip().lower()
    if normalized in {"easy", "medium", "hard"}:
        return normalized
    return "medium" if fallback == "mixed" else fallback


def _normalize_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]
