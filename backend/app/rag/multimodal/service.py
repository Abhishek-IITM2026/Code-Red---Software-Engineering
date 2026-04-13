from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any

from flask import current_app

from ...repositories import (
    RAGChunkRepository,
    RAGDocumentRepository,
    RAGImageRepository,
    RAGIngestionRunRepository,
    MaterialSourceRepository,
)
from ...upload_storage import build_public_file_url
from .discovery import DiscoveredSource, discover_sources
from .embeddings import embed_image_query, embed_image_records, embed_query_text, embed_texts
from .parser import parse_source
from .runtime import multimodal_dependency_status, normalize_text, normalize_week_label, split_text
from .vector_store import get_vector_backend


def ingest_sources(
    *,
    scan_root: str | None = None,
    source_path: str | None = None,
    triggered_by: str = "manual",
) -> dict[str, Any]:
    resolved_scan_root = str(Path(scan_root or current_app.config.get("RAG_SOURCE_ROOT")).resolve())
    run_type = "incremental" if source_path else "full"
    run_repository = RAGIngestionRunRepository()

    if run_type == "full":
        active_run = run_repository.get_active_run(run_type="full")
        if active_run is not None:
            return {
                "status": "running",
                "message": "A full ingestion run is already in progress.",
                "runId": active_run.get("_id"),
                "scanRoot": resolved_scan_root,
            }

    run_id = run_repository.create_run(
        run_type=run_type,
        scan_root=resolved_scan_root,
        triggered_by=triggered_by,
        source_path=source_path,
    )
    summary = {
        "processed": 0,
        "skipped": 0,
        "failed": 0,
        "unsupported": 0,
    }
    failures: list[dict[str, str]] = []

    try:
        discovery = discover_sources(scan_root=resolved_scan_root, source_path=source_path)
        summary["unsupported"] = len(discovery["unsupported"])
        vector_backend = get_vector_backend()
        document_repository = RAGDocumentRepository()
        chunk_repository = RAGChunkRepository()
        image_repository = RAGImageRepository()
        material_repo = MaterialSourceRepository()

        for source in discovery["supported"]:
            existing = document_repository.find_one_by_filters({"sourceKey": source.source_key})
            if existing and not _source_needs_refresh(
                source=source,
                existing_document=existing,
                chunk_repository=chunk_repository,
                image_repository=image_repository,
            ):
                summary["skipped"] += 1
                continue

            try:
                parsed = parse_source(source)
                document_storage_path = _build_document_storage_path(scan_root=resolved_scan_root, relative_path=source.relative_path)
                document_payload = {
                    "sourceKey": source.source_key,
                    "relativePath": source.relative_path,
                    "storagePath": document_storage_path,
                    "documentUrl": build_public_file_url(document_storage_path),
                    "className": source.class_name,
                    "subject": source.subject,
                    "week": source.week,
                    "weekNumber": source.week_number,
                    "sourceFile": source.source_file,
                    "fileHash": source.file_hash,
                    "pageCount": parsed.get("pageCount", 0),
                    "pageToImages": parsed.get("pageToImages") or {},
                    "contentText": parsed.get("contentText") or "",
                    "indexedAt": datetime.utcnow().isoformat(),
                }
                document_id = document_repository.upsert_document(source.source_key, document_payload)

                # Sync extracted content back to MaterialSource record if found
                material_source = material_repo.get_by_storage_path(document_storage_path)
                if material_source and "materialId" in material_source:
                    material_repo.upsert(
                        material_id=int(material_source["materialId"]),
                        payload={"contentText": parsed.get("contentText") or ""}
                    )

                vector_backend.delete_source(source.source_key)
                chunk_repository.delete_by_filters({"sourceKey": source.source_key})
                image_repository.delete_by_filters({"sourceKey": source.source_key})

                chunk_payloads = _build_chunk_payloads(source=source, parsed=parsed, document_id=document_id, document_url=document_payload["documentUrl"])
                image_payloads = _build_image_payloads(source=source, parsed=parsed, document_id=document_id, document_url=document_payload["documentUrl"])

                if not chunk_payloads and not image_payloads:
                    summary["failed"] += 1
                    failures.append(
                        {
                            "sourceKey": source.source_key,
                            "message": "No extractable text or images were found in this document.",
                        }
                    )
                    continue

                text_embeddings = embed_texts([item["text"] for item in chunk_payloads]) if chunk_payloads else []
                vector_backend.upsert_text_entries(
                    [
                        {
                            "vectorId": f"text::{item['chunkKey']}",
                            "embedding": embedding,
                            "document": item["text"],
                            "metadata": {
                                "mongo_id": item["mongoId"],
                                "chunk_key": item["chunkKey"],
                                "source_key": source.source_key,
                                "class_name": source.class_name,
                                "subject": source.subject,
                                "week": source.week,
                                "source_file": source.source_file,
                                "page": int(item["page"]),
                            },
                        }
                        for item, embedding in zip(chunk_payloads, text_embeddings)
                    ]
                )

                image_embeddings = embed_image_records(image_payloads) if image_payloads else []
                vector_backend.upsert_image_entries(
                    [
                        {
                            "vectorId": f"image::{item['imageKey']}",
                            "embedding": embedding,
                            "document": item["textSurrogate"],
                            "metadata": {
                                "mongo_id": item["mongoId"],
                                "image_key": item["imageKey"],
                                "source_key": source.source_key,
                                "class_name": source.class_name,
                                "subject": source.subject,
                                "week": source.week,
                                "source_file": source.source_file,
                                "page": int(item["page"]),
                            },
                        }
                        for item, embedding in zip(image_payloads, image_embeddings)
                    ]
                )
                summary["processed"] += 1
            except Exception as exc:
                summary["failed"] += 1
                failures.append({"sourceKey": source.source_key, "message": str(exc)})

        final_status = "completed" if summary["failed"] == 0 else "completed_with_errors"
        result = {
            "runId": run_id,
            "status": final_status,
            "scanRoot": resolved_scan_root,
            "vectorBackend": vector_backend.backend_name,
            "summary": summary,
            "unsupported": discovery["unsupported"],
            "failures": failures,
        }
        run_repository.update_run(run_id, **result)
        return result
    except Exception as exc:
        run_repository.update_run(
            run_id,
            status="failed",
            error=str(exc),
            summary=summary,
        )
        raise


def retrieve_context(
    *,
    query: str,
    subject: str | None = None,
    week: str | None = None,
    allowed_source_files: set[str] | None = None,
    allowed_weeks: set[str] | None = None,
    top_k_text: int | None = None,
    top_k_images: int | None = None,
) -> dict[str, Any]:
    backend = get_vector_backend()
    if backend.count_text() == 0:
        return {
            "vectorAvailable": False,
            "textMatches": [],
            "imageMatches": [],
            "backend": backend.backend_name,
        }

    resolved_top_k_text = top_k_text or int(current_app.config.get("RAG_TEXT_TOP_K", 4))
    resolved_top_k_images = top_k_images or int(current_app.config.get("RAG_IMAGE_TOP_K", 3))
    where = _build_query_filter(subject=subject, week=week if not allowed_weeks or len(allowed_weeks) == 1 else None)
    text_matches = backend.search_text(
        embedding=embed_query_text(query),
        where=where,
        top_k=max(resolved_top_k_text * 3, resolved_top_k_text),
    )
    image_matches = backend.search_images(
        embedding=embed_image_query(query),
        where=where,
        top_k=max(resolved_top_k_images * 3, resolved_top_k_images),
    )

    hydrated_text = _filter_and_hydrate_text_matches(
        matches=text_matches,
        allowed_source_files=allowed_source_files,
        allowed_weeks=allowed_weeks,
        top_k=resolved_top_k_text,
    )
    hydrated_images = _filter_and_hydrate_image_matches(
        matches=image_matches,
        allowed_source_files=allowed_source_files,
        allowed_weeks=allowed_weeks,
        top_k=resolved_top_k_images,
    )

    return {
        "vectorAvailable": True,
        "textMatches": hydrated_text,
        "imageMatches": hydrated_images,
        "backend": backend.backend_name,
    }


def ensure_multimodal_index(
    *,
    source_path: str | None = None,
    triggered_by: str = "auto-bootstrap",
) -> dict[str, Any]:
    backend = get_vector_backend()
    if backend.count_text() > 0:
        return {
            "ready": True,
            "performedIngestion": False,
            "backend": backend.backend_name,
            "dependencyStatus": multimodal_dependency_status(),
        }

    try:
        result = ingest_sources(source_path=source_path, triggered_by=triggered_by)
    except Exception as exc:
        return {
            "ready": False,
            "performedIngestion": True,
            "error": str(exc),
            "backend": backend.backend_name,
            "dependencyStatus": multimodal_dependency_status(),
        }

    refreshed_backend = get_vector_backend()
    return {
        "ready": refreshed_backend.count_text() > 0,
        "performedIngestion": True,
        "result": result,
        "backend": refreshed_backend.backend_name,
        "dependencyStatus": multimodal_dependency_status(),
    }


def ensure_material_sources_ready(
    materials: list[dict[str, Any]] | None,
    *,
    triggered_by: str = "auto-material-refresh",
) -> dict[str, Any]:
    refreshed: list[dict[str, Any]] = []
    for material in materials or []:
        absolute_source_path = _resolve_material_source_path(material)
        if absolute_source_path is None:
            continue
        result = ingest_sources(source_path=str(absolute_source_path), triggered_by=triggered_by)
        refreshed.append(
            {
                "materialId": str(material.get("id") or ""),
                "sourcePath": str(absolute_source_path),
                "result": result,
            }
        )
    return {"refreshed": refreshed}


def derive_material_scope(materials: list[dict[str, Any]] | None) -> dict[str, set[str]]:
    weeks: set[str] = set()
    source_files: set[str] = set()
    for material in materials or []:
        week = normalize_week_label(material.get("week"))
        if week:
            weeks.add(week)
        for candidate in (
            material.get("documentName"),
            material.get("fileName"),
            material.get("storagePath"),
            material.get("documentUrl"),
        ):
            value = normalize_text(candidate)
            if not value:
                continue
            source_files.add(Path(value).name)
    return {"weeks": weeks, "sourceFiles": source_files}


def build_question_context(query: str, matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
    context_chunks: list[dict[str, Any]] = []
    for index, match in enumerate(matches):
        context_chunks.append(
            {
                "chunkId": match.get("chunkKey") or f"retrieved-{index + 1}",
                "materialId": match.get("documentId"),
                "materialTitle": match.get("sourceFile"),
                "materialType": "document",
                "unit": None,
                "week": match.get("week"),
                "documentUrl": match.get("documentUrl"),
                "imageUrls": match.get("images") or [],
                "text": match.get("text") or "",
                "tokens": normalize_text(f"{query} {match.get('text') or ''}").lower().split(),
            }
        )
    return context_chunks


def _resolve_material_source_path(material: dict[str, Any]) -> Path | None:
    upload_root = Path(current_app.config["UPLOAD_ROOT"]).resolve()
    storage_path = normalize_text(material.get("storagePath"))
    if storage_path:
        candidate = (upload_root / storage_path).resolve()
        if candidate.exists():
            return candidate

    document_url = normalize_text(material.get("documentUrl"))
    if document_url.startswith("/uploads/"):
        relative_upload_path = document_url.removeprefix("/uploads/").lstrip("/")
        candidate = (upload_root / relative_upload_path).resolve()
        if candidate.exists():
            return candidate
    return None


def _source_needs_refresh(
    *,
    source: DiscoveredSource,
    existing_document: dict[str, Any],
    chunk_repository: RAGChunkRepository,
    image_repository: RAGImageRepository,
) -> bool:
    if existing_document.get("fileHash") != source.file_hash:
        return True
    if _document_image_assets_missing(existing_document):
        return True
    has_chunk_docs = bool(chunk_repository.find_many({"sourceKey": source.source_key}, limit=1))
    has_image_docs = bool(image_repository.find_many({"sourceKey": source.source_key}, limit=1))
    return not has_chunk_docs and not has_image_docs


def _document_image_assets_missing(document: dict[str, Any]) -> bool:
    upload_root = Path(current_app.config["UPLOAD_ROOT"]).resolve()
    page_to_images = document.get("pageToImages") or {}
    for image_urls in page_to_images.values():
        for image_url in image_urls or []:
            normalized_url = normalize_text(image_url)
            if not normalized_url.startswith("/uploads/"):
                continue
            relative_path = normalized_url.removeprefix("/uploads/").lstrip("/")
            if not (upload_root / relative_path).exists():
                return True
    return False


def _build_chunk_payloads(
    *,
    source: DiscoveredSource,
    parsed: dict[str, Any],
    document_id: str,
    document_url: str | None,
) -> list[dict[str, Any]]:
    chunk_repository = RAGChunkRepository()
    payloads: list[dict[str, Any]] = []
    for page in parsed.get("pages") or []:
        page_number = int(page.get("page") or 1)
        page_images = [item.get("url") for item in page.get("images") or [] if item.get("url")]
        fallback_label = (
            f"Image-based study material for {source.subject} {source.week} from {Path(source.source_file).stem}."
            if page_images
            else None
        )
        for index, chunk_text in enumerate(split_text(page.get("text") or "", fallback_label=fallback_label), start=1):
            chunk_key = f"{source.source_key}::page:{page_number}::chunk:{index}"
            payload = {
                "chunkKey": chunk_key,
                "documentId": document_id,
                "sourceKey": source.source_key,
                "className": source.class_name,
                "subject": source.subject,
                "week": source.week,
                "weekNumber": source.week_number,
                "sourceFile": source.source_file,
                "page": page_number,
                "images": page_images,
                "text": chunk_text,
                "documentUrl": document_url,
                "createdAt": datetime.utcnow().isoformat(),
            }
            mongo_id = chunk_repository.upsert_chunk(chunk_key, payload)
            payloads.append({**payload, "mongoId": mongo_id})
    return payloads


def _build_image_payloads(
    *,
    source: DiscoveredSource,
    parsed: dict[str, Any],
    document_id: str,
    document_url: str | None,
) -> list[dict[str, Any]]:
    image_repository = RAGImageRepository()
    payloads: list[dict[str, Any]] = []
    for image in parsed.get("images") or []:
        payload = {
            "imageKey": image["imageKey"],
            "documentId": document_id,
            "sourceKey": source.source_key,
            "className": source.class_name,
            "subject": source.subject,
            "week": source.week,
            "weekNumber": source.week_number,
            "sourceFile": source.source_file,
            "page": image.get("page"),
            "storagePath": image.get("storagePath"),
            "url": image.get("url"),
            "documentUrl": document_url,
            "contentType": image.get("contentType"),
            "textSurrogate": image.get("textSurrogate"),
            "absolutePath": image.get("absolutePath"),
            "createdAt": datetime.utcnow().isoformat(),
        }
        mongo_id = image_repository.upsert_image(image["imageKey"], payload)
        payloads.append({**payload, "mongoId": mongo_id})
    return payloads


def _build_document_storage_path(*, scan_root: str, relative_path: str) -> str:
    scan_root_path = Path(scan_root).resolve()
    upload_root = Path(current_app.config["UPLOAD_ROOT"]).resolve()
    try:
        relative_root = scan_root_path.relative_to(upload_root)
    except ValueError:
        relative_root = Path(scan_root_path.name)
    return str((relative_root / relative_path).as_posix())


def _build_query_filter(*, subject: str | None, week: str | None) -> dict[str, Any] | None:
    conditions: list[dict[str, Any]] = []
    if subject:
        conditions.append({"subject": subject})
    if week:
        conditions.append({"week": week})
    
    if not conditions:
        return None
    if len(conditions) == 1:
        return conditions[0]
    return {"$and": conditions}


def _filter_and_hydrate_text_matches(
    *,
    matches: list[dict[str, Any]],
    allowed_source_files: set[str] | None,
    allowed_weeks: set[str] | None,
    top_k: int,
) -> list[dict[str, Any]]:
    repository = RAGChunkRepository()
    hydrated: list[dict[str, Any]] = []
    for match in matches:
        metadata = match.get("metadata") or {}
        if allowed_source_files and Path(str(metadata.get("source_file") or "")).name not in allowed_source_files:
            continue
        if allowed_weeks and str(metadata.get("week") or "") not in allowed_weeks:
            continue
        document = repository.find_one(str(metadata.get("mongo_id") or ""))
        if document is None:
            document = {
                "chunkKey": metadata.get("chunk_key"),
                "subject": metadata.get("subject"),
                "week": metadata.get("week"),
                "sourceFile": metadata.get("source_file"),
                "page": metadata.get("page"),
                "text": match.get("document"),
                "images": [],
            }
        document["score"] = match.get("score", 0.0)
        hydrated.append(document)
        if len(hydrated) >= top_k:
            break
    return hydrated


def _filter_and_hydrate_image_matches(
    *,
    matches: list[dict[str, Any]],
    allowed_source_files: set[str] | None,
    allowed_weeks: set[str] | None,
    top_k: int,
) -> list[dict[str, Any]]:
    repository = RAGImageRepository()
    hydrated: list[dict[str, Any]] = []
    for match in matches:
        metadata = match.get("metadata") or {}
        if allowed_source_files and Path(str(metadata.get("source_file") or "")).name not in allowed_source_files:
            continue
        if allowed_weeks and str(metadata.get("week") or "") not in allowed_weeks:
            continue
        document = repository.find_one(str(metadata.get("mongo_id") or ""))
        if document is None:
            document = {
                "imageKey": metadata.get("image_key"),
                "subject": metadata.get("subject"),
                "week": metadata.get("week"),
                "sourceFile": metadata.get("source_file"),
                "page": metadata.get("page"),
                "url": None,
            }
        document["score"] = match.get("score", 0.0)
        hydrated.append(document)
        if len(hydrated) >= top_k:
            break
    return hydrated
