from __future__ import annotations

from pathlib import Path
from typing import Any

from flask import current_app

from ...upload_storage import build_public_file_url
from .discovery import DiscoveredSource
from .runtime import fitz, normalize_text, safe_slug


def parse_source(source: DiscoveredSource) -> dict[str, Any]:
    if source.extension == ".txt":
        return _parse_txt(source)
    if source.extension == ".pdf":
        return _parse_pdf(source)
    raise ValueError(f"Unsupported source extension: {source.extension}")


def _parse_txt(source: DiscoveredSource) -> dict[str, Any]:
    raw_text = source.absolute_path.read_text(encoding="utf-8", errors="ignore")
    page = {
        "page": 1,
        "text": normalize_text(raw_text),
        "images": [],
    }
    return {
        "contentText": page["text"],
        "pages": [page],
        "images": [],
        "pageToImages": {"1": []},
        "pageCount": 1,
    }


def _parse_pdf(source: DiscoveredSource) -> dict[str, Any]:
    if fitz is None:
        raise RuntimeError("PyMuPDF is not installed; PDF ingestion is unavailable.")

    pages: list[dict[str, Any]] = []
    images: list[dict[str, Any]] = []
    page_to_images: dict[str, list[str]] = {}

    with fitz.open(source.absolute_path) as document:  # type: ignore[union-attr]
        for page_index in range(document.page_count):
            page = document.load_page(page_index)
            page_number = page_index + 1
            page_text = normalize_text(page.get_text("text"))
            page_images: list[dict[str, Any]] = []

            for image_index, image_info in enumerate(page.get_images(full=True), start=1):
                xref = image_info[0]
                extracted = document.extract_image(xref)
                payload = extracted.get("image")
                extension = extracted.get("ext") or "png"
                if not payload:
                    continue
                image_path = _write_extracted_image(
                    subject=source.subject,
                    week=source.week,
                    source_file=source.source_file,
                    page_number=page_number,
                    image_index=image_index,
                    extension=extension,
                    payload=payload,
                )
                image_relative_path = str(image_path.relative_to(Path(current_app.config["UPLOAD_ROOT"]).resolve()))
                image_url = build_public_file_url(image_relative_path)
                image_entry = {
                    "imageKey": f"{source.source_key}::page:{page_number}::image:{image_index}",
                    "page": page_number,
                    "sourceFile": source.source_file,
                    "subject": source.subject,
                    "week": source.week,
                    "absolutePath": str(image_path),
                    "storagePath": image_relative_path.replace("\\", "/"),
                    "url": image_url,
                    "contentType": f"image/{extension.lower()}",
                    "textSurrogate": normalize_text(
                        f"{source.subject} {source.week} {Path(source.source_file).stem} page {page_number} image {image_index}"
                    ),
                }
                images.append(image_entry)
                page_images.append(image_entry)

            pages.append(
                {
                    "page": page_number,
                    "text": page_text,
                    "images": page_images,
                }
            )
            page_to_images[str(page_number)] = [item["url"] for item in page_images if item.get("url")]

    return {
        "contentText": normalize_text(" ".join(page["text"] for page in pages if page.get("text"))),
        "pages": pages,
        "images": images,
        "pageToImages": page_to_images,
        "pageCount": len(pages),
    }


def _write_extracted_image(
    *,
    subject: str,
    week: str,
    source_file: str,
    page_number: int,
    image_index: int,
    extension: str,
    payload: bytes,
) -> Path:
    upload_root = Path(current_app.config["UPLOAD_ROOT"]).resolve()
    file_stem = Path(source_file).stem
    relative_path = (
        Path("images")
        / safe_slug(subject, fallback="subject")
        / safe_slug(week, fallback="week")
        / f"{safe_slug(file_stem, fallback='page')}-p{page_number}-img{image_index}.{extension}"
    )
    absolute_path = upload_root / relative_path
    absolute_path.parent.mkdir(parents=True, exist_ok=True)
    absolute_path.write_bytes(payload)
    return absolute_path
