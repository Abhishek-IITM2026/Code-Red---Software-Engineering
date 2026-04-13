from __future__ import annotations

import math
import re
from typing import Any

from flask import current_app

from .extractors import normalize_text


STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "in", "is", "it",
    "its", "of", "on", "or", "that", "the", "their", "this", "to", "was", "with", "will",
    "can", "could", "would", "should", "may", "might", "must",
    "what", "which", "why", "when", "where", "how", "who", "whom",
    "you", "your", "yours", "me", "my", "mine", "we", "our", "ours",
    "do", "does", "did", "doing", "done",
    "explain", "understand", "tell", "give", "show", "help", "describe", "define",
    "if", "then", "but", "because", "so", "such", "also",
    "get", "make", "take", "have", "just", "made",
    "more", "most", "some", "any", "all", "each", "every", "other",
    "about", "above", "after", "again", "before", "below", "between", "during",
    "very", "too", "not", "no", "yes", "here", "there", "now", "then", "only",
    "first", "second", "third", "last", "next",
    "question", "answer", "topic", "material", "chapter", "section",
}
TOKEN_RE = re.compile(r"[A-Za-z0-9]+")


def build_material_chunks(materials: list[dict[str, Any]]) -> list[dict[str, Any]]:
    chunks: list[dict[str, Any]] = []
    chunk_size = int(current_app.config.get("RAG_CHUNK_SIZE", 700))
    chunk_overlap = int(current_app.config.get("RAG_CHUNK_OVERLAP", 120))

    for material in materials:
        combined_sections = [
            material.get("title"),
            material.get("description"),
            material.get("sourceText"),
            material.get("contentText"),
        ]
        combined_text = normalize_text(" ".join(section for section in combined_sections if section))
        text_chunks = _chunk_text(combined_text, chunk_size=chunk_size, overlap=chunk_overlap)

        if not text_chunks and material.get("imageUrls"):
            text_chunks = [
                f"Image-based study material for {material.get('title') or 'the selected topic'}."
            ]

        for index, text in enumerate(text_chunks):
            chunks.append(
                {
                    "chunkId": f"{material.get('id', 'material')}-{index + 1}",
                    "materialId": str(material.get("id")),
                    "materialTitle": material.get("title"),
                    "materialType": material.get("type"),
                    "unit": material.get("unit"),
                    "week": material.get("week"),
                    "documentUrl": material.get("documentUrl"),
                    "imageUrls": material.get("imageUrls") or [],
                    "text": text,
                    "tokens": tokenize(text),
                }
            )

    return chunks


def rank_chunks(
    chunks: list[dict[str, Any]],
    *,
    subject_name: str,
    custom_prompt: str | None,
    question_type: str,
    max_chunks: int | None = None,
) -> list[dict[str, Any]]:
    query_tokens = set(tokenize(" ".join(filter(None, [subject_name, custom_prompt, question_type]))))
    max_chunks = max_chunks or int(current_app.config.get("RAG_MAX_CONTEXT_CHUNKS", 6))

    scored = []
    for chunk in chunks:
        overlap = len(query_tokens & set(chunk["tokens"]))
        density_bonus = min(len(chunk["tokens"]) / 20.0, 3.0)
        image_bonus = 1.0 if chunk.get("imageUrls") else 0.0
        score = overlap * 3 + density_bonus + image_bonus
        scored.append((score, chunk))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [chunk for score, chunk in scored if score > 0][:max_chunks] or [chunk for _, chunk in scored[:max_chunks]]


def tokenize(text: str | None) -> list[str]:
    tokens = [token.lower() for token in TOKEN_RE.findall(text or "")]
    return [token for token in tokens if len(token) > 2 and token not in STOPWORDS]


def summarize_text(text: str, *, max_words: int = 28) -> str:
    words = normalize_text(text).split()
    if len(words) <= max_words:
        return " ".join(words)
    return " ".join(words[:max_words]).rstrip(".,;:") + "..."


def extract_keywords(text: str, *, limit: int = 5) -> list[str]:
    scores: dict[str, float] = {}
    for token in tokenize(text):
        scores[token] = scores.get(token, 0.0) + 1.0
    ordered = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    return [token for token, _ in ordered[:limit]]


def distribute_marks(total_marks: int, count: int) -> list[int]:
    base = max(1, math.floor(total_marks / max(count, 1)))
    remainder = max(total_marks - (base * count), 0)
    marks = [base] * count
    for index in range(remainder):
        marks[index % count] += 1
    return marks


def build_question_type_plan(question_types: dict[str, int], question_count: int) -> list[str]:
    plan: list[str] = []
    for question_type, count in question_types.items():
        plan.extend([question_type] * max(int(count or 0), 0))
    if not plan:
        plan = ["mcq", "short", "long", "trueFalse"]
    return [plan[index % len(plan)] for index in range(question_count)]


def _chunk_text(text: str, *, chunk_size: int, overlap: int) -> list[str]:
    normalized = normalize_text(text)
    if not normalized:
        return []

    words = normalized.split()
    if len(words) <= chunk_size:
        return [normalized]

    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(len(words), start + chunk_size)
        chunks.append(" ".join(words[start:end]))
        if end >= len(words):
            break
        start = max(end - overlap, start + 1)
    return chunks
