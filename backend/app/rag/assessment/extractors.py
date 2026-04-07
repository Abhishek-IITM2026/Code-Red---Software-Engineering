from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from flask import current_app

from ...models import Material, UploadedDocument
from ...upload_storage import build_public_file_url


TEXT_EXTENSIONS = {".txt", ".md", ".markdown", ".csv", ".json", ".html", ".htm"}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"}
WHITESPACE_RE = re.compile(r"\s+")
HTML_TAG_RE = re.compile(r"<[^>]+>")


def normalize_text(value: str | None) -> str:
    return WHITESPACE_RE.sub(" ", (value or "")).strip()


def extract_material_source_payload(
    *,
    material: Material,
    source_text: str | None = None,
    external_url: str | None = None,
    image_urls: list[str] | None = None,
    uploaded_document: UploadedDocument | None = None,
) -> dict[str, Any]:
    document_payload = extract_uploaded_document_payload(uploaded_document)
    merged_image_urls = _dedupe(
        [
            *(image_urls or []),
            *(document_payload.get("imageUrls") or []),
        ]
    )

    return {
        "materialId": str(material.id),
        "sourceText": normalize_text(source_text),
        "externalUrl": (external_url or "").strip() or None,
        "imageUrls": merged_image_urls,
        "document": document_payload.get("document"),
        "documentId": document_payload.get("documentId"),
        "documentName": document_payload.get("documentName"),
        "documentUrl": document_payload.get("documentUrl"),
        "contentType": document_payload.get("contentType"),
        "contentText": normalize_text(document_payload.get("contentText")),
    }


def extract_uploaded_document_payload(uploaded_document: UploadedDocument | None) -> dict[str, Any]:
    if uploaded_document is None:
        return {
            "document": None,
            "documentId": None,
            "documentName": None,
            "documentUrl": None,
            "contentType": None,
            "contentText": "",
            "imageUrls": [],
        }

    url = build_public_file_url(uploaded_document.storage_path)
    absolute_path = Path(current_app.config["UPLOAD_ROOT"]).resolve() / uploaded_document.storage_path
    suffix = absolute_path.suffix.lower()
    content_type = (uploaded_document.content_type or "").lower()
    image_urls = [url] if url and (suffix in IMAGE_EXTENSIONS or content_type.startswith("image/")) else []

    return {
        "document": uploaded_document.to_dict(),
        "documentId": str(uploaded_document.id),
        "documentName": uploaded_document.original_filename,
        "documentUrl": url,
        "contentType": uploaded_document.content_type,
        "contentText": _extract_text_from_path(absolute_path, suffix),
        "imageUrls": image_urls,
    }


def _extract_text_from_path(path: Path, suffix: str) -> str:
    if not path.exists() or suffix not in TEXT_EXTENSIONS:
        return ""

    try:
        raw_text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return ""

    if suffix == ".json":
        try:
            parsed = json.loads(raw_text)
            raw_text = _json_to_text(parsed)
        except json.JSONDecodeError:
            pass
    elif suffix in {".html", ".htm"}:
        raw_text = HTML_TAG_RE.sub(" ", raw_text)

    return normalize_text(raw_text)


def _json_to_text(value: Any) -> str:
    if isinstance(value, dict):
        return " ".join(_json_to_text(item) for item in value.values())
    if isinstance(value, list):
        return " ".join(_json_to_text(item) for item in value)
    if value is None:
        return ""
    return str(value)


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    unique: list[str] = []
    for value in values:
        normalized = (value or "").strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        unique.append(normalized)
    return unique
