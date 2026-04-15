from __future__ import annotations

import hashlib
import logging
import math
from functools import lru_cache
from pathlib import Path
from typing import Any

from flask import current_app

from .runtime import normalize_text

try:  # pragma: no cover - optional dependency
    from sentence_transformers import SentenceTransformer
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    SentenceTransformer = None

try:  # pragma: no cover - optional dependency
    import torch
    from PIL import Image
    from transformers import CLIPModel, CLIPProcessor
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    torch = None
    Image = None
    CLIPModel = None
    CLIPProcessor = None


FALLBACK_DIMENSION = 128
SENTENCE_TRANSFORMERS_LOGGER = logging.getLogger("sentence_transformers.SentenceTransformer")


def _normalize_vector(values: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in values))
    if norm == 0.0:
        return values
    return [value / norm for value in values]


def _hash_embedding(seed_text: str, *, dim: int = FALLBACK_DIMENSION) -> list[float]:
    values = [0.0] * dim
    for token in normalize_text(seed_text).lower().split():
        token_bytes = hashlib.sha256(token.encode("utf-8")).digest()
        for index, byte in enumerate(token_bytes[: min(16, dim)]):
            bucket = (index * 7 + byte) % dim
            values[bucket] += (byte / 255.0) + 0.01
    return _normalize_vector(values)


@lru_cache(maxsize=1)
def _load_text_model():
    if SentenceTransformer is None:
        return None
    configured_name = str(current_app.config.get("RAG_TEXT_MODEL") or "").strip()
    candidate_names: list[str] = []
    if configured_name:
        candidate_names.append(configured_name)
        if configured_name.startswith("sentence-transformers/"):
            candidate_names.append(configured_name.split("/", 1)[1])

    seen: set[str] = set()
    for model_name in candidate_names:
        if not model_name or model_name in seen:
            continue
        seen.add(model_name)
        try:  # pragma: no cover - depends on local model cache
            previous_level = SENTENCE_TRANSFORMERS_LOGGER.level
            SENTENCE_TRANSFORMERS_LOGGER.setLevel(logging.ERROR)
            return SentenceTransformer(
                model_name,
                local_files_only=True,
            )
        except Exception:
            continue
        finally:
            SENTENCE_TRANSFORMERS_LOGGER.setLevel(previous_level)
    return None


@lru_cache(maxsize=1)
def _load_clip_components():
    if CLIPModel is None or CLIPProcessor is None or torch is None:
        return None, None
    model_name = current_app.config.get("RAG_CLIP_MODEL")
    try:  # pragma: no cover - depends on local model cache
        processor = CLIPProcessor.from_pretrained(model_name, local_files_only=True, use_fast=True)
        model = CLIPModel.from_pretrained(model_name, local_files_only=True)
        model.eval()
        return model, processor
    except Exception:
        return None, None


def embed_texts(texts: list[str]) -> list[list[float]]:
    model = _load_text_model()
    normalized_texts = [normalize_text(text) for text in texts]
    if model is None:
        return [_hash_embedding(text) for text in normalized_texts]

    try:  # pragma: no cover - depends on local model cache
        embeddings = model.encode(normalized_texts, normalize_embeddings=True)
        return [list(map(float, row)) for row in embeddings.tolist()]
    except Exception:
        return [_hash_embedding(text) for text in normalized_texts]


def embed_query_text(query: str) -> list[float]:
    return embed_texts([query])[0]


def embed_image_records(records: list[dict[str, Any]]) -> list[list[float]]:
    model, processor = _load_clip_components()
    if model is None or processor is None or Image is None or torch is None:
        return [_hash_embedding(_image_surrogate_text(record)) for record in records]

    images = []
    valid_records: list[dict[str, Any]] = []
    for record in records:
        try:  # pragma: no cover - depends on PIL/image bytes
            images.append(Image.open(Path(record["absolutePath"])).convert("RGB"))
            valid_records.append(record)
        except Exception:
            images.append(None)
            valid_records.append(record)

    if not any(image is not None for image in images):
        return [_hash_embedding(_image_surrogate_text(record)) for record in records]

    results: list[list[float]] = []
    for record, image in zip(valid_records, images):
        if image is None:
            results.append(_hash_embedding(_image_surrogate_text(record)))
            continue
        try:  # pragma: no cover - depends on local model cache
            inputs = processor(images=image, return_tensors="pt")
            with torch.no_grad():
                features = model.get_image_features(**inputs)
            vector = features[0].tolist()
            results.append(_normalize_vector([float(value) for value in vector]))
        except Exception:
            results.append(_hash_embedding(_image_surrogate_text(record)))
    return results


def embed_image_query(query: str) -> list[float]:
    model, processor = _load_clip_components()
    if model is None or processor is None or torch is None:
        return _hash_embedding(query)

    try:  # pragma: no cover - depends on local model cache
        inputs = processor(text=[query], return_tensors="pt", padding=True)
        with torch.no_grad():
            features = model.get_text_features(**inputs)
        return _normalize_vector([float(value) for value in features[0].tolist()])
    except Exception:
        return _hash_embedding(query)


def _image_surrogate_text(record: dict[str, Any]) -> str:
    return normalize_text(
        " ".join(
            str(item or "")
            for item in (
                record.get("subject"),
                record.get("week"),
                record.get("sourceFile"),
                record.get("page"),
                record.get("textSurrogate"),
            )
        )
    )
