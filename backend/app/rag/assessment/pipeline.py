from __future__ import annotations

from typing import Any

from ...api.errors import ApiError
from .llm import try_generate_llm_grounded_questions
from .retrieval import (
    build_material_chunks,
    build_question_type_plan,
    distribute_marks,
    extract_keywords,
    rank_chunks,
    summarize_text,
)


def generate_grounded_questions(
    *,
    subject_name: str,
    materials: list[dict[str, Any]],
    question_count: int,
    total_marks: int,
    difficulty_level: str,
    question_types: dict[str, int],
    custom_prompt: str | None = None,
    ai_settings: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    chunks = build_material_chunks(materials)
    if not chunks:
        raise ApiError(
            422,
            "RAG_MATERIALS_UNAVAILABLE",
            "Selected study materials do not contain usable text or image context for question generation.",
        )

    llm_questions = try_generate_llm_grounded_questions(
        subject_name=subject_name,
        chunks=chunks,
        question_count=question_count,
        total_marks=total_marks,
        difficulty_level=difficulty_level,
        question_types=question_types,
        custom_prompt=custom_prompt,
        ai_settings=ai_settings,
    )
    if llm_questions:
        return llm_questions
    provider = str((ai_settings or {}).get("provider") or "grounded-rag").strip().lower()
    if provider in {"openai-compatible-cloud", "openai-compatible-local"} and not (ai_settings or {}).get(
        "fallbackToGroundedRag",
        True,
    ):
        raise ApiError(
            503,
            "AI_PROVIDER_UNAVAILABLE",
            "The configured external AI provider did not return usable questions and fallback is disabled.",
        )

    marks_plan = distribute_marks(total_marks=max(int(total_marks or 1), 1), count=max(int(question_count or 1), 1))
    question_type_plan = build_question_type_plan(question_types, len(marks_plan))
    questions: list[dict[str, Any]] = []

    for index, marks in enumerate(marks_plan):
        question_type = question_type_plan[index]
        ranked_chunks = rank_chunks(
            chunks,
            subject_name=subject_name,
            custom_prompt=custom_prompt,
            question_type=question_type,
        )
        primary_chunk = ranked_chunks[index % len(ranked_chunks)]
        supporting_chunks = ranked_chunks[:2]
        question = _build_question(
            index=index,
            subject_name=subject_name,
            question_type=question_type,
            difficulty_level=difficulty_level,
            marks=marks,
            primary_chunk=primary_chunk,
            supporting_chunks=supporting_chunks,
        )
        questions.append(question)

    return questions


def _build_question(
    *,
    index: int,
    subject_name: str,
    question_type: str,
    difficulty_level: str,
    marks: int,
    primary_chunk: dict[str, Any],
    supporting_chunks: list[dict[str, Any]],
) -> dict[str, Any]:
    prompt_focus = summarize_text(primary_chunk["text"], max_words=32)
    keywords = extract_keywords(primary_chunk["text"], limit=6)
    image_urls = primary_chunk.get("imageUrls") or []
    topic = primary_chunk.get("materialTitle") or (keywords[0].title() if keywords else subject_name)
    context_snippet = summarize_text(" ".join(chunk["text"] for chunk in supporting_chunks), max_words=50)
    source_material_ids = [chunk["materialId"] for chunk in supporting_chunks if chunk.get("materialId")]
    source_material_titles = [chunk["materialTitle"] for chunk in supporting_chunks if chunk.get("materialTitle")]

    builder_map = {
        "mcq": _build_mcq,
        "trueFalse": _build_true_false,
        "long": _build_long_answer,
        "short": _build_short_answer,
    }
    builder = builder_map.get(question_type, _build_short_answer)
    question = builder(
        index=index,
        subject_name=subject_name,
        topic=topic,
        keywords=keywords,
        prompt_focus=prompt_focus,
        context_snippet=context_snippet,
        image_urls=image_urls,
    )
    question.update(
        {
            "id": f"rag-{index + 1}",
            "marks": marks,
            "difficulty": "medium" if difficulty_level == "mixed" else difficulty_level,
            "imageUrls": image_urls or None,
            "contextSnippet": context_snippet,
            "sourceMaterialIds": source_material_ids,
            "sourceMaterialTitles": source_material_titles,
        }
    )
    return question


def _build_mcq(*, index: int, topic: str, keywords: list[str], prompt_focus: str, context_snippet: str, image_urls: list[str], **_: Any) -> dict[str, Any]:
    headline = f"Based on the material about {topic}, which option best matches the core idea?"
    if image_urls:
        headline = f"{headline} Refer to the accompanying image if needed."

    correct_option = prompt_focus.rstrip(".")
    distractors = [
        f"It focuses mainly on {keyword} only." for keyword in keywords[1:4]
    ]
    while len(distractors) < 3:
        distractors.append(f"It is unrelated to {topic.lower()} in the current lesson.")
    options = [correct_option, *distractors[:3]]
    return {
        "questionText": headline,
        "questionType": "mcq",
        "options": options,
        "correctAnswer": correct_option,
    }


def _build_true_false(*, index: int, topic: str, keywords: list[str], prompt_focus: str, image_urls: list[str], **_: Any) -> dict[str, Any]:
    is_true = index % 2 == 0
    statement = prompt_focus.rstrip(".")
    if not is_true and keywords:
        replacement = keywords[-1]
        if replacement not in statement.lower():
            statement = f"{statement} This statement is primarily about {replacement}."
        else:
            statement = f"{statement} This statement does not apply to {topic.lower()}."
    if image_urls:
        statement = f"Refer to the accompanying image. {statement}"
    return {
        "questionText": statement,
        "questionType": "trueFalse",
        "options": ["True", "False"],
        "correctAnswer": "True" if is_true else "False",
    }


def _build_short_answer(*, topic: str, keywords: list[str], context_snippet: str, image_urls: list[str], **_: Any) -> dict[str, Any]:
    focus = keywords[0] if keywords else topic
    prompt = f"In 2-3 sentences, explain {focus} using the study material for {topic}."
    if image_urls:
        prompt = f"{prompt} Use the attached image as supporting context."
    return {
        "questionText": prompt,
        "questionType": "short",
        "options": None,
        "correctAnswer": context_snippet,
    }


def _build_long_answer(*, topic: str, keywords: list[str], context_snippet: str, image_urls: list[str], **_: Any) -> dict[str, Any]:
    pair = ", ".join(keyword for keyword in keywords[:2]) or topic
    prompt = f"Write a detailed answer describing how {pair} connects within {topic}."
    if image_urls:
        prompt = f"{prompt} Reference the attached image in your explanation."
    return {
        "questionText": prompt,
        "questionType": "long",
        "options": None,
        "correctAnswer": context_snippet,
    }
