from __future__ import annotations

import json
from typing import Any

from ..rag.llm_clients import (
    EXTERNAL_PROVIDER_ERRORS,
    SUPPORTED_EXTERNAL_PROVIDERS,
    extract_text_content,
    post_external_chat_completion,
    resolve_external_runtime,
)
from ..rag.assessment.retrieval import build_material_chunks, rank_chunks, summarize_text, tokenize




def _is_casual_student_prompt(question: str) -> bool:
    normalized = question.strip().lower()
    casual_phrases = {
        "hi",
        "hello",
        "hey",
        "hiya",
        "good morning",
        "good afternoon",
        "good evening",
        "thanks",
        "thank you",
        "thankyou",
        "bye",
        "goodbye",
    }
    if normalized in casual_phrases:
        return True
    if len(normalized) <= 5 and any(normalized.startswith(prefix) for prefix in ("hi", "hey", "yo", "ok", "sup")):
        return True
    return False


def _build_casual_response(subject_name: str) -> dict[str, Any]:
    return {
        "answer": (
            f"Hi! I’m your {subject_name} assistant. Ask me any subject question, and I’ll answer using uploaded study materials and academic knowledge."
        ),
        "citations": [],
        "followUpQuestions": [
            f"What topic should I revise first in {subject_name}?",
            f"Explain the main ideas in {subject_name}.",
            f"Give me a revision summary for {subject_name}.",
        ],
        "confidence": "medium",
    }
def answer_subject_question(
    *,
    subject_name: str,
    question: str,
    materials: list[dict[str, Any]],
    history: list[dict[str, str]] | None = None,
    ai_settings: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if _is_casual_student_prompt(question):
        return _build_casual_response(subject_name)

    chunks = build_material_chunks(materials)
    ranked_chunks = rank_chunks(
        chunks,
        subject_name=subject_name,
        custom_prompt=question,
        question_type="student-chat",
        max_chunks=4,
    ) if chunks else []

    llm_answer = _try_generate_llm_answer(
        subject_name=subject_name,
        question=question,
        ranked_chunks=ranked_chunks,
        history=history or [],
        ai_settings=ai_settings or {},
    )
    if llm_answer is not None:
        return llm_answer

    return _build_grounded_fallback_answer(
        subject_name=subject_name,
        question=question,
        ranked_chunks=ranked_chunks,
    )


def _try_generate_llm_answer(
    *,
    subject_name: str,
    question: str,
    ranked_chunks: list[dict[str, Any]],
    history: list[dict[str, str]],
    ai_settings: dict[str, Any],
) -> dict[str, Any] | None:
    provider, base_url, model, api_key = resolve_external_runtime(ai_settings)
    if provider not in SUPPORTED_EXTERNAL_PROVIDERS:
        return None

    if not model:
        return None

    prompt_payload = {
        "subject": subject_name,
        "question": question,
        "recentHistory": history[-6:],
        "context": [
            {
                "materialId": chunk.get("materialId"),
                "materialTitle": chunk.get("materialTitle"),
                "unit": chunk.get("unit"),
                "week": chunk.get("week"),
                "documentUrl": chunk.get("documentUrl"),
                "imageUrls": chunk.get("imageUrls") or [],
                "text": chunk.get("text"),
            }
            for chunk in ranked_chunks
        ],
    }
    prompt = (
        "Answer the student's subject question as a helpful Gemini AI tutor. "
        "Use the supplied course context only if it is directly relevant to the question. "
        "If the context is not directly relevant, answer from broader academic knowledge. "
        "Only include citations when you directly use the provided material. "
        "Do not claim live internet browsing unless that is explicitly available in the model environment. "
        "Return valid JSON only with this schema: "
        '{"answer":"...","citations":[{"materialId":"1","materialTitle":"Unit 1 Notes","snippet":"..."}],'
        '"followUps":["...","..."],"confidence":"high|medium|low"}'
        "\nDo not include markdown fences or extra commentary.\n"
        f"{json.dumps(prompt_payload, ensure_ascii=True)}"
    )

    try:
        response_payload = post_external_chat_completion(
            provider=provider,
            base_url=base_url,
            api_key=api_key,
            model=model,
            prompt=prompt,
            system_prompt=(
                "You are a careful academic tutor. Use provided context when available, "
                "but you may also answer from broader knowledge. "
                "Return concise JSON that matches the required schema."
            ),
            temperature=float(ai_settings.get("temperature", 0.2) or 0.2),
            max_tokens=int(ai_settings.get("maxTokens", 900) or 900),
        )
    except EXTERNAL_PROVIDER_ERRORS:
        return None

    raw_content = extract_text_content(provider, response_payload)
    if not raw_content:
        return None

    parsed = _parse_json_object(raw_content)
    if isinstance(parsed, dict):
        citations = _normalize_citations(parsed.get("citations"), ranked_chunks)
        return {
            "answer": str(parsed.get("answer") or "").strip() or _fallback_answer_text(subject_name, question, ranked_chunks),
            "citations": citations,
            "followUpQuestions": _normalize_follow_ups(parsed.get("followUps")),
            "confidence": _normalize_confidence(parsed.get("confidence")),
        }

    normalized_answer = str(raw_content or "").strip()
    if normalized_answer:
        return {
            "answer": normalized_answer,
            "citations": _normalize_citations(None, ranked_chunks),
            "followUpQuestions": [],
            "confidence": "medium",
        }

    return None


def _build_grounded_fallback_answer(
    *,
    subject_name: str,
    question: str,
    ranked_chunks: list[dict[str, Any]],
) -> dict[str, Any]:
    if not ranked_chunks:
        return {
            "answer": (
                f"I could not find uploaded {subject_name} material for this question yet. "
                "I can still answer broader subject questions once an external AI provider is configured in AI Settings."
            ),
            "citations": [],
            "followUpQuestions": [
                f"Explain the basics of {subject_name}.",
                f"What are the most important topics to revise in {subject_name}?",
            ],
            "confidence": "low",
        }

    question_tokens = set(tokenize(question))
    chunk_scores = []
    for chunk in ranked_chunks:
        chunk_tokens = set(chunk.get("tokens") or [])
        overlap = len(question_tokens & chunk_tokens)
        chunk_scores.append((overlap, chunk))

    chunk_scores.sort(key=lambda item: item[0], reverse=True)
    primary_chunk = chunk_scores[0][1]
    supporting_chunks = [chunk for _, chunk in chunk_scores[1:3]]
    best_overlap = chunk_scores[0][0]

    question_focus = question.strip().rstrip("?")
    answer_parts = [f"For your question about {question_focus}, here is what the uploaded material says:"]
    answer_parts.append(summarize_text(primary_chunk.get("text") or "", max_words=70))

    if best_overlap == 0 and question_tokens:
        answer_parts = [
            (
                f"I could not find a direct match for \"{question_focus}\" in the available {subject_name} files. "
                "I am sharing the closest related content below."
            ),
            summarize_text(primary_chunk.get("text") or "", max_words=60),
        ]

    answer_parts = [
        *answer_parts,
    ]
    if supporting_chunks and best_overlap > 0:
        answer_parts.append(
            f"Related context: {summarize_text(' '.join(chunk.get('text') or '' for chunk in supporting_chunks), max_words=40)}"
        )
    answer_parts.append(f"This answer is grounded in the currently uploaded {subject_name} study materials.")

    return {
        "answer": " ".join(part for part in answer_parts if part).strip(),
        "citations": _normalize_citations(None, [primary_chunk, *supporting_chunks]),
        "followUpQuestions": [
            f"Can you explain this topic in simpler terms with an example?",
            f"Which part of {primary_chunk.get('materialTitle') or 'the material'} should I revise first?",
        ],
        "confidence": "medium" if best_overlap > 0 else "low",
    }


def _fallback_answer_text(subject_name: str, question: str, ranked_chunks: list[dict[str, Any]]) -> str:
    if not ranked_chunks:
        return (
            f"I could not find uploaded material for this {subject_name} question, "
            "but I can still help once broader AI provider access is available."
        )
    return (
        f"For your question, \"{question}\", the most relevant uploaded material suggests: "
        f"{summarize_text(ranked_chunks[0].get('text') or '', max_words=60)}"
    )


def _normalize_citations(value: Any, ranked_chunks: list[dict[str, Any]]) -> list[dict[str, str]]:
    citations: list[dict[str, str]] = []
    if isinstance(value, list):
        for item in value:
            if not isinstance(item, dict):
                continue
            citations.append(
                {
                    "materialId": str(item.get("materialId") or "").strip(),
                    "materialTitle": str(item.get("materialTitle") or "Study Material").strip(),
                    "snippet": summarize_text(str(item.get("snippet") or "").strip(), max_words=26),
                }
            )
    if citations:
        return citations[:3]

    for chunk in ranked_chunks[:3]:
        citations.append(
            {
                "materialId": str(chunk.get("materialId") or "").strip(),
                "materialTitle": str(chunk.get("materialTitle") or "Study Material").strip(),
                "snippet": summarize_text(chunk.get("text") or "", max_words=26),
            }
        )
    return citations


def _normalize_follow_ups(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    follow_ups = [str(item).strip() for item in value if str(item).strip()]
    return follow_ups[:3]


def _normalize_confidence(value: Any) -> str:
    normalized = str(value or "").strip().lower()
    if normalized in {"high", "medium", "low"}:
        return normalized
    return "medium"


def _parse_json_object(raw_content: str) -> dict[str, Any] | None:
    cleaned = raw_content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

    candidates = [cleaned]
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidates.append(cleaned[start : end + 1])

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    return None
