from __future__ import annotations

import json
from typing import Any

from ..rag.assessment.retrieval import build_material_chunks, rank_chunks, summarize_text, tokenize, extract_keywords
from ..rag.llm_clients import (
    EXTERNAL_PROVIDER_ERRORS,
    SUPPORTED_EXTERNAL_PROVIDERS,
    extract_text_content,
    post_external_chat_completion,
    resolve_external_runtime,
)
from ..repositories import MaterialSourceRepository
from .multimodal import (
    build_deadline_guard_response,
    derive_material_scope,
    ensure_material_sources_ready,
    ensure_multimodal_index,
    find_active_assessment_guards,
    should_block_direct_answer,
    retrieve_context,
)
from .multimodal.runtime import normalize_week_label


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
        "referencedImages": [],
    }


def answer_subject_question(
    *,
    subject_id: int,
    subject_name: str,
    question: str,
    week: str | None,
    materials: list[dict[str, Any]],
    history: list[dict[str, str]] | None = None,
    ai_settings: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if _is_casual_student_prompt(question):
        return _build_casual_response(subject_name)

    material_scope = derive_material_scope(materials)
    scoped_weeks = set(material_scope.get("weeks") or set())
    normalized_week = normalize_week_label(week) if week else None
    if normalized_week:
        scoped_weeks.add(normalized_week)

    ensure_material_sources_ready(materials, triggered_by="student-chat-material-refresh")
    bootstrap = ensure_multimodal_index(triggered_by="student-chat")

    active_assessments = find_active_assessment_guards(subject_id=subject_id, week=week)
    if active_assessments and should_block_direct_answer(question):
        return build_deadline_guard_response(subject_name=subject_name, week=week or "this week", assessments=active_assessments)

    retrieval = retrieve_context(
        query=question,
        subject=subject_name,
        week=normalized_week,
        allowed_source_files=material_scope.get("sourceFiles") or None,
        allowed_weeks=scoped_weeks or None,
    )
    if retrieval.get("vectorAvailable") and (retrieval.get("textMatches") or retrieval.get("imageMatches")):
        llm_answer = _try_generate_llm_answer(
            subject_name=subject_name,
            question=question,
            week=week,
            retrieval=retrieval,
            history=history or [],
            ai_settings=ai_settings or {},
        )
        if llm_answer is not None:
            return llm_answer
        return _build_multimodal_fallback_answer(
            subject_name=subject_name,
            question=question,
            week=week,
            retrieval=retrieval,
        )

    # FINAL FALLBACK: If vector search failed (low quality matches),
    # try to get the raw extracted text from MaterialSource for each material.
    from ..repositories.rag import RAGDocumentRepository
    doc_repo = RAGDocumentRepository()
    material_source_repo = MaterialSourceRepository()

    all_found_text: list[str] = []
    for mat in materials:
        storage_path = mat.get("storagePath")
        material_id = mat.get("id")
        found_text = None

        # 1. Try the document repository (extracted raw text)
        if storage_path:
            found_text = doc_repo.get_all_text_for_material(storage_path)

        # 2. If nothing, try the MaterialSource record (contentText set during ingestion)
        if not found_text and material_id:
            source = material_source_repo.get_by_material(int(material_id))
            if source:
                found_text = source.get("contentText")

        # 3. If still nothing, try matching by storage path in MaterialSource
        if not found_text and storage_path:
            source = material_source_repo.get_by_storage_path(storage_path)
            if source:
                found_text = source.get("contentText")

        if found_text and found_text.strip():
            all_found_text.append(found_text.strip())

    if all_found_text:
        combined_text = " ".join(all_found_text)
        # Use a simple keyword-based search in raw text as a last resort
        if any(word.lower() in combined_text.lower() for word in question.split()):
            return _build_grounded_fallback_answer(
                subject_name=subject_name,
                question=question,
                ranked_chunks=[
                    {
                        "text": combined_text,
                        "materialId": materials[0].get("id"),
                        "materialTitle": materials[0].get("title"),
                        "tokens": tokenize(combined_text),
                    }
                ]
            )

    multimodal_unavailable = _build_multimodal_unavailable_response(
        subject_name=subject_name,
        week=week,
        materials=materials,
        bootstrap=bootstrap,
    )
    if multimodal_unavailable is not None:
        return multimodal_unavailable

    chunks = build_material_chunks(materials)
    ranked_chunks = (
        rank_chunks(
            chunks,
            subject_name=subject_name,
            custom_prompt=question,
            question_type="student-chat",
            max_chunks=4,
        )
        if chunks
        else []
    )
    
    if not chunks and materials:
        # If multimodal retrieval found matches, use them instead of the empty MaterialSource fallback
        if retrieval.get("vectorAvailable") and retrieval.get("textMatches"):
            return _build_grounded_fallback_answer(
                subject_name=subject_name,
                question=question,
                ranked_chunks=[
                    {
                        "text": m.get("text"),
                        "materialId": m.get("documentId"),
                        "materialTitle": m.get("sourceFile"),
                        "week": m.get("week"),
                        "tokens": tokenize(m.get("text") or ""),
                    }
                    for m in retrieval.get("textMatches")[:4]
                ]
            )

        return {
            "answer": f"No study material content is available for {subject_name}{f' in {week}' if week else ''}. Please upload study materials first, then ask your question.",
            "citations": [],
            "followUpQuestions": [
                f"Ask your teacher to upload study materials for {subject_name}.",
                f"Check if materials are available for {week or 'this week'}.",
            ],
            "confidence": "low",
            "referencedImages": [],
        }
    
    if not materials:
        return {
            "answer": f"No study materials are available for {subject_name}{f' in {week}' if week else ''}. Please select or ask your teacher to upload materials first.",
            "citations": [],
            "followUpQuestions": [
                f"Ask your teacher to upload study materials for {subject_name}.",
                "Check available weeks with materials.",
            ],
            "confidence": "low",
            "referencedImages": [],
        }
    
    return _build_grounded_fallback_answer(subject_name=subject_name, question=question, ranked_chunks=ranked_chunks)


def _build_multimodal_unavailable_response(
    *,
    subject_name: str,
    week: str | None,
    materials: list[dict[str, Any]],
    bootstrap: dict[str, Any],
) -> dict[str, Any] | None:
    dependency_status = bootstrap.get("dependencyStatus") or {}
    bootstrap_result = bootstrap.get("result") or {}
    failures = bootstrap_result.get("failures") or []
    has_pdf_material = any(str(item.get("type") or "").strip().lower() == "pdf" for item in materials)
    
    if has_pdf_material and not dependency_status.get("pymupdf", False):
        return {
            "answer": (
                f"I could not use multimodal RAG for {subject_name}"
                f"{f' in {week}' if week else ''} because PDF parsing is unavailable on the server right now. "
                "PyMuPDF is not installed, so uploaded PDF study materials cannot be extracted into the vector index yet. "
                "I'll answer using the study material text instead."
            ),
            "citations": [],
            "followUpQuestions": [
                "Ask your admin to install backend RAG dependencies if you want better PDF support.",
                f"Ask follow-up questions about {subject_name}.",
            ],
            "confidence": "medium",
            "referencedImages": [],
        }
    
    if bootstrap.get("error"):
        error_msg = str(bootstrap.get("error") or "").strip()
        return {
            "answer": (
                f"The document index preparation encountered an error for {subject_name}"
                f"{f' in {week}' if week else ''}: {error_msg} "
                "I'll still answer using the available study materials."
            ),
            "citations": [],
            "followUpQuestions": [
                "Ask your admin to check backend RAG configuration.",
                f"Ask another question about {subject_name}.",
            ],
            "confidence": "medium",
            "referencedImages": [],
        }
    
    return None


def _try_generate_llm_answer(
    *,
    subject_name: str,
    question: str,
    week: str | None,
    retrieval: dict[str, Any],
    history: list[dict[str, str]],
    ai_settings: dict[str, Any],
) -> dict[str, Any] | None:
    provider, base_url, model, api_key, _mode = resolve_external_runtime(ai_settings)
    if provider not in SUPPORTED_EXTERNAL_PROVIDERS or not model:
        return None

    prompt_payload = {
        "subject": subject_name,
        "week": week,
        "question": question,
        "recentHistory": history[-6:],
        "context": [
            {
                "chunkKey": chunk.get("chunkKey"),
                "sourceFile": chunk.get("sourceFile"),
                "page": chunk.get("page"),
                "week": chunk.get("week"),
                "images": chunk.get("images") or [],
                "text": chunk.get("text"),
            }
            for chunk in retrieval.get("textMatches") or []
        ],
        "imageReferences": [
            {
                "url": image.get("url"),
                "page": image.get("page"),
                "sourceFile": image.get("sourceFile"),
                "week": image.get("week"),
            }
            for image in retrieval.get("imageMatches") or []
        ],
    }
    prompt = (
        "Answer the student's subject question as a careful academic tutor. "
        "Mention the subject and week when they are known. "
        "Use the supplied context when relevant. "
        "Format the answer as polished Markdown suitable for a modern study app. "
        "Prefer a short heading, then concise sections such as Key Idea, Explanation, Steps, Example, and Quick Revision when relevant. "
        "Use bullet points and numbered steps where they improve readability. "
        "Do not use markdown tables unless the comparison is genuinely clearer that way. "
        "If images are useful, mention them briefly using their references. "
        "Return valid JSON only with this schema: "
        '{"answer":"...","citations":[{"materialId":"1","materialTitle":"Week 1 Notes","snippet":"..."}],'
        '"followUps":["...","..."],"confidence":"high|medium|low",'
        '"referencedImages":[{"url":"...","page":1,"sourceFile":"notes.pdf","subject":"Physics","week":"Week 2"}]}'
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
                "You are a careful academic tutor. Return concise JSON that matches the required schema, and make the answer field polished Markdown."
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
        return {
            "answer": str(parsed.get("answer") or "").strip() or _fallback_answer_text(subject_name, question, retrieval),
            "citations": _normalize_citations(parsed.get("citations"), retrieval),
            "followUpQuestions": _normalize_follow_ups(parsed.get("followUps")),
            "confidence": _normalize_confidence(parsed.get("confidence")),
            "referencedImages": _normalize_referenced_images(parsed.get("referencedImages"), retrieval),
        }

    normalized_answer = str(raw_content or "").strip()
    if normalized_answer:
        return {
            "answer": normalized_answer,
            "citations": _normalize_citations(None, retrieval),
            "followUpQuestions": [],
            "confidence": "medium",
            "referencedImages": _normalize_referenced_images(None, retrieval),
        }
    return None


def _build_multimodal_fallback_answer(
    *,
    subject_name: str,
    question: str,
    week: str | None,
    retrieval: dict[str, Any],
) -> dict[str, Any]:
    text_matches = retrieval.get("textMatches") or []
    image_matches = retrieval.get("imageMatches") or []
    if not text_matches:
        answer = (
            f"I found image-based material for {subject_name}"
            f"{f' in {week}' if week else ''}, but not enough extracted text to answer directly."
        )
        if image_matches:
            answer += " I’ve attached the most relevant image references below for guided review."
        return {
            "answer": answer,
            "citations": [],
            "followUpQuestions": [
                f"Explain the main concepts from {week or 'this subject'} in {subject_name}.",
            ],
            "confidence": "low",
            "referencedImages": _normalize_referenced_images(None, retrieval),
        }

    primary = text_matches[0]
    related = " ".join(item.get("text") or "" for item in text_matches[1:3])
    answer_parts = [
        f"### {subject_name}{f' • {week}' if week else ''}",
        f"**Question focus:** {question.strip().rstrip('?')}",
        summarize_text(primary.get("text") or "", max_words=70),
    ]
    if related:
        answer_parts.append(f"**Related context:** {summarize_text(related, max_words=40)}")
    if image_matches:
        answer_parts.append("**Visual support:** Relevant figure references are included below when they support the explanation.")
    return {
        "answer": " ".join(part for part in answer_parts if part).strip(),
        "citations": _normalize_citations(None, retrieval),
        "followUpQuestions": [
            f"Can you explain this topic in simpler terms for {subject_name}?",
            f"Which source should I revise first for {week or subject_name}?",
        ],
        "confidence": "medium",
        "referencedImages": _normalize_referenced_images(None, retrieval),
    }


def _is_metadata_only(text: str, title: str) -> bool:
    """Check if text is just metadata (title/description) without real content."""
    if not text:
        return True

    text_lower = text.lower()
    title_lower = title.lower()

    metadata_patterns = [
        "chapter",
        "section",
        "notes",
        "material",
        "topic",
        "module",
        "week",
        "unit",
        "structured",
    ]

    word_count = len(text.split())

    # Relaxed word count threshold for RAG chunks
    if word_count < 5:
        return True

    # Only reject if it's ALMOST entirely metadata patterns and very short
    pattern_count = sum(1 for pattern in metadata_patterns if pattern in text_lower)
    if word_count < 15 and pattern_count >= 3:
        return True

    # Check if it's just a repetition of the title
    title_words = [w for w in title_lower.split() if len(w) > 3]
    if not title_words:
        return False

    title_words_in_text = sum(1 for word in title_words if word in text_lower)
    if word_count < 15 and title_words_in_text >= len(title_words) * 0.8:
        return True

    return False


def _build_grounded_fallback_answer(
    *,
    subject_name: str,
    question: str,
    ranked_chunks: list[dict[str, Any]],
) -> dict[str, Any]:
    if not ranked_chunks:
        return {
            "answer": (
                f"I could not find uploaded {subject_name} material matching your question. "
                f"Ask your teacher to upload study materials with detailed content for {subject_name}."
            ),
            "citations": [],
            "followUpQuestions": [
                f"What topics are covered in {subject_name}?",
                f"When are the next {subject_name} assessments?",
            ],
            "confidence": "low",
            "referencedImages": [],
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

    primary_text = (primary_chunk.get("text") or "").strip()
    material_title = str(primary_chunk.get("materialTitle") or "Study Material")
    
    if not primary_text or len(primary_text.split()) < 5:
        if _is_metadata_only(primary_text, material_title):
            return {
                "answer": (
                    f"I found a reference to {material_title} in the materials, but it contains only a heading or brief label. "
                    f"Please ask your teacher for more detailed notes on this topic."
                ),
                "citations": [
                    {
                        "materialId": str(primary_chunk.get("materialId") or ""),
                        "materialTitle": material_title,
                        "snippet": material_title,
                    }
                ],
                "followUpQuestions": [
                    f"Remind your teacher to upload {subject_name} materials with full content.",
                    f"Is there a textbook or other resource for {subject_name}?",
                ],
                "confidence": "low",
                "referencedImages": [],
            }
        return {
            "answer": (
                f"The available {material_title} material is quite brief. "
                f"For better help, your teacher should upload more detailed study notes or resources."
            ),
            "citations": [
                {
                    "materialId": str(primary_chunk.get("materialId") or ""),
                    "materialTitle": material_title,
                    "snippet": summarize_text(primary_text, max_words=32) if primary_text else material_title,
                }
            ],
            "followUpQuestions": [
                f"Ask your teacher to add more content to {material_title}.",
                f"Try asking about the key concepts in {subject_name}.",
            ],
            "confidence": "low",
            "referencedImages": [],
        }

    primary_summary = summarize_text(primary_text, max_words=80)
    answer_parts = [primary_summary]
    if supporting_chunks:
        supporting_text = " ".join(chunk.get("text") or "" for chunk in supporting_chunks)
        supporting_summary = summarize_text(supporting_text, max_words=50)
        if supporting_summary:
            answer_parts.append(supporting_summary)
    
    citations = [
        {
            "materialId": str(primary_chunk.get("materialId") or ""),
            "materialTitle": material_title,
            "snippet": primary_summary[:80] if primary_summary else material_title,
        }
    ]
    
    extracted_keywords = extract_keywords(question)
    followups = []
    for keyword in extracted_keywords[:2]:
        followups.append(f"How does {keyword} relate to {subject_name}?")
    if len(followups) < 2:
        followups.append(f"What are the practical applications of this topic?")
    if len(followups) < 2:
        followups.append(f"How would you approach a question about this in an exam?")
    
    return {
        "answer": "\n\n".join(
            part
            for part in [
                f"### {subject_name}",
                f"**Answer:** {answer_parts[0]}" if answer_parts else "",
                f"**Extra context:** {answer_parts[1]}" if len(answer_parts) > 1 else "",
            ]
            if part
        ).strip(),
        "citations": citations,
        "followUpQuestions": followups[:2],
        "confidence": "medium",
        "referencedImages": [],
    }


def _fallback_answer_text(subject_name: str, question: str, retrieval: dict[str, Any]) -> str:
    text_matches = retrieval.get("textMatches") or []
    if not text_matches:
        return (
            f"I found limited indexed material for {subject_name}, so I cannot confidently answer {question!r} yet."
        )
    primary = text_matches[0]
    return summarize_text(primary.get("text") or "", max_words=80)


def _normalize_citations(citations: Any, retrieval: dict[str, Any]) -> list[dict[str, str]]:
    if isinstance(citations, list):
        normalized: list[dict[str, str]] = []
        for item in citations:
            if not isinstance(item, dict):
                continue
            normalized.append(
                {
                    "materialId": str(item.get("materialId") or ""),
                    "materialTitle": str(item.get("materialTitle") or "Study Material"),
                    "snippet": str(item.get("snippet") or "").strip(),
                }
            )
        if normalized:
            return normalized

    normalized = []
    for match in (retrieval.get("textMatches") or [])[:3]:
        normalized.append(
            {
                "materialId": str(match.get("documentId") or ""),
                "materialTitle": str(match.get("sourceFile") or "Study Material"),
                "snippet": summarize_text(match.get("text") or "", max_words=32),
            }
        )
    return normalized


def _normalize_follow_ups(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    normalized = []
    for item in value:
        text = str(item or "").strip()
        if text:
            normalized.append(text)
    return normalized[:3]


def _normalize_confidence(value: Any) -> str:
    normalized = str(value or "").strip().lower()
    if normalized in {"high", "medium", "low"}:
        return normalized
    return "medium"


def _normalize_referenced_images(value: Any, retrieval: dict[str, Any]) -> list[dict[str, Any]]:
    if isinstance(value, list):
        normalized = []
        for item in value:
            if not isinstance(item, dict):
                continue
            normalized.append(
                {
                    "url": item.get("url"),
                    "page": item.get("page"),
                    "sourceFile": item.get("sourceFile"),
                    "subject": item.get("subject"),
                    "week": item.get("week"),
                }
            )
        if normalized:
            return normalized

    normalized = []
    for item in (retrieval.get("imageMatches") or [])[:3]:
        normalized.append(
            {
                "url": item.get("url"),
                "page": item.get("page"),
                "sourceFile": item.get("sourceFile"),
                "subject": item.get("subject"),
                "week": item.get("week"),
            }
        )
    return normalized


def _parse_json_object(raw_content: str) -> dict[str, Any] | None:
    cleaned = raw_content.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

    for candidate in (cleaned, _extract_json_candidate(cleaned)):
        if not candidate:
            continue
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return parsed
    return None


def _extract_json_candidate(content: str) -> str | None:
    start = content.find("{")
    end = content.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    return content[start : end + 1]
