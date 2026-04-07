from __future__ import annotations

import json
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

from .retrieval import build_question_type_plan, distribute_marks, rank_chunks, summarize_text


SUPPORTED_EXTERNAL_PROVIDERS = {"openai-compatible-cloud", "openai-compatible-local"}


def try_generate_llm_grounded_questions(
    *,
    subject_name: str,
    chunks: list[dict[str, Any]],
    question_count: int,
    total_marks: int,
    difficulty_level: str,
    question_types: dict[str, int],
    custom_prompt: str | None,
    ai_settings: dict[str, Any] | None,
) -> list[dict[str, Any]] | None:
    settings = ai_settings or {}
    provider = str(settings.get("provider") or "grounded-rag").strip().lower()
    if provider not in SUPPORTED_EXTERNAL_PROVIDERS:
        return None

    base_url = str(settings.get("baseUrl") or "").strip().rstrip("/")
    model = str(settings.get("model") or "").strip()
    if not base_url or not model or not chunks:
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

    try:
        response_payload = _post_chat_completion(
            base_url=base_url,
            api_key=settings.get("apiKey"),
            model=model,
            prompt=prompt,
            temperature=float(settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(settings.get("maxTokens", 1200) or 1200),
        )
    except (OSError, urllib_error.URLError, urllib_error.HTTPError, ValueError, json.JSONDecodeError):
        return None

    raw_content = _extract_message_content(response_payload)
    if not raw_content:
        return None

    parsed_questions = _parse_json_questions(raw_content)
    if not parsed_questions:
        return None

    return _normalize_question_payloads(
        parsed_questions,
        marks_plan=marks_plan,
        question_type_plan=question_type_plan,
        difficulty_level=difficulty_level,
        ranked_chunks=ranked_chunks,
    )


def _post_chat_completion(
    *,
    base_url: str,
    api_key: str | None,
    model: str,
    prompt: str,
    temperature: float,
    max_tokens: int,
) -> dict[str, Any]:
    payload = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a careful academic assessment generator. "
                    "Use only the provided context and return machine-readable JSON."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    }
    headers = {
        "Content-Type": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    request = urllib_request.Request(
        f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )
    with urllib_request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def _extract_message_content(payload: dict[str, Any]) -> str | None:
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    message = choices[0].get("message") if isinstance(choices[0], dict) else None
    if not isinstance(message, dict):
        return None
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                text_parts.append(item["text"])
        return "".join(text_parts) or None
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
