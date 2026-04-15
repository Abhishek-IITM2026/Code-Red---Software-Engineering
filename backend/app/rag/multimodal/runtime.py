from __future__ import annotations

import hashlib
import math
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

from flask import current_app
from werkzeug.utils import secure_filename

try:  # pragma: no cover - optional dependency
    import fitz  # type: ignore
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    fitz = None

try:  # pragma: no cover - optional dependency
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    RecursiveCharacterTextSplitter = None

try:  # pragma: no cover - optional dependency
    from transformers import AutoTokenizer
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    AutoTokenizer = None


SUPPORTED_SOURCE_EXTENSIONS = {".pdf", ".txt"}
WHITESPACE_RE = re.compile(r"\s+")
WEEK_RE = re.compile(r"week\s*(\d+)", re.IGNORECASE)


def normalize_text(value: str | None) -> str:
    return WHITESPACE_RE.sub(" ", (value or "")).strip()


def normalize_week_label(value: str | None) -> str | None:
    raw = normalize_text(value)
    if not raw:
        return None
    if raw.isdigit():
        return f"Week {raw}"
    match = WEEK_RE.fullmatch(raw)
    if match:
        return f"Week {match.group(1)}"
    return raw


def parse_week_number(value: str | None) -> int | None:
    normalized = normalize_week_label(value)
    if not normalized:
        return None
    match = WEEK_RE.search(normalized)
    if match:
        try:
            return int(match.group(1))
        except ValueError:
            return None
    return None


def safe_slug(value: str | None, *, fallback: str = "item") -> str:
    normalized = secure_filename((value or "").strip())
    return normalized or fallback


def compute_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


@lru_cache(maxsize=1)
def _build_langchain_splitter():
    if RecursiveCharacterTextSplitter is None or AutoTokenizer is None:
        return None
    try:  # pragma: no cover - depends on local model cache
        tokenizer = AutoTokenizer.from_pretrained(
            current_app.config.get("RAG_TEXT_MODEL"),
            local_files_only=True,
        )
        return RecursiveCharacterTextSplitter.from_huggingface_tokenizer(
            tokenizer,
            chunk_size=int(current_app.config.get("RAG_CHUNK_TOKENS", 700)),
            chunk_overlap=int(current_app.config.get("RAG_CHUNK_TOKEN_OVERLAP", 100)),
        )
    except Exception:
        return None


def split_text(text: str, *, fallback_label: str | None = None) -> list[str]:
    normalized = normalize_text(text)
    if not normalized and fallback_label:
        normalized = fallback_label
    if not normalized:
        return []

    splitter = _build_langchain_splitter()
    if splitter is not None:
        try:
            return [chunk for chunk in splitter.split_text(normalized) if normalize_text(chunk)]
        except Exception:
            pass

    chunk_size = max(int(current_app.config.get("RAG_CHUNK_TOKENS", 700)), 1)
    overlap = max(int(current_app.config.get("RAG_CHUNK_TOKEN_OVERLAP", 100)), 0)
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


def cosine_similarity(vector_a: list[float], vector_b: list[float]) -> float:
    if not vector_a or not vector_b or len(vector_a) != len(vector_b):
        return 0.0
    dot = sum(left * right for left, right in zip(vector_a, vector_b))
    left_norm = math.sqrt(sum(value * value for value in vector_a))
    right_norm = math.sqrt(sum(value * value for value in vector_b))
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return dot / (left_norm * right_norm)


def multimodal_dependency_status() -> dict[str, bool]:
    return {
        "pymupdf": fitz is not None,
        "langchainTextSplitter": RecursiveCharacterTextSplitter is not None,
    }
