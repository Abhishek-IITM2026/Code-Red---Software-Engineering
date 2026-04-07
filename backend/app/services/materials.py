from __future__ import annotations

from typing import Any

from werkzeug.datastructures import FileStorage

from ..api.errors import ApiError
from ..extensions import db
from ..models import Material, Subject, UploadedDocument, User
from ..repositories import MaterialSourceRepository
from ..rag.assessment.extractors import extract_material_source_payload, normalize_text
from ..upload_storage import save_uploaded_file


def serialize_material(material: Material) -> dict[str, Any]:
    payload = material.to_dict()
    source = MaterialSourceRepository().get_by_material(material.id) or {}
    content_preview = source.get("contentText") or source.get("sourceText") or ""
    payload.update(
        {
            "documentId": source.get("documentId"),
            "documentName": source.get("documentName"),
            "documentUrl": source.get("documentUrl"),
            "externalUrl": source.get("externalUrl"),
            "imageUrls": source.get("imageUrls") or [],
            "contentTextPreview": normalize_text(content_preview)[:280] or None,
            "ragContextAvailable": bool(source.get("contentText") or source.get("sourceText") or source.get("imageUrls")),
        }
    )
    return payload


def list_subject_materials(subject_id: int) -> list[dict[str, Any]]:
    materials = Material.query.filter_by(subject_id=subject_id).order_by(Material.id.desc()).all()
    return [serialize_material(material) for material in materials]


def get_materials_for_generation(subject_id: int, selected_materials: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    selected_ids: list[int] = []
    for item in selected_materials or []:
        try:
            if item.get("id") is not None:
                selected_ids.append(int(item["id"]))
        except (TypeError, ValueError):
            continue

    query = Material.query.filter_by(subject_id=subject_id)
    if selected_ids:
        query = query.filter(Material.id.in_(selected_ids))

    materials = query.order_by(Material.id.desc()).all()
    payloads: list[dict[str, Any]] = []
    repository = MaterialSourceRepository()
    for material in materials:
        source = repository.get_by_material(material.id) or {}
        payloads.append(
            {
                **material.to_dict(),
                "sourceText": source.get("sourceText"),
                "contentText": source.get("contentText"),
                "externalUrl": source.get("externalUrl"),
                "imageUrls": source.get("imageUrls") or [],
                "documentId": source.get("documentId"),
                "documentName": source.get("documentName"),
                "documentUrl": source.get("documentUrl"),
            }
        )
    return payloads


def create_material_with_source(
    *,
    subject: Subject,
    actor: User,
    title: str,
    unit: str | None,
    week: str | None,
    material_type: str,
    description: str | None,
    source_text: str | None = None,
    external_url: str | None = None,
    image_urls: list[str] | None = None,
    document_id: int | None = None,
    uploaded_file: FileStorage | None = None,
) -> Material:
    uploaded_document = _resolve_uploaded_document(
        actor=actor,
        document_id=document_id,
        uploaded_file=uploaded_file,
    )

    material = Material(
        subject_id=subject.id,
        title=title,
        unit=unit,
        week=week,
        material_type=material_type,
        description=description,
    )
    db.session.add(material)
    db.session.flush()

    source_payload = extract_material_source_payload(
        material=material,
        source_text=source_text,
        external_url=external_url,
        image_urls=image_urls,
        uploaded_document=uploaded_document,
    )
    if _has_source_payload(source_payload):
        MaterialSourceRepository().upsert(material.id, source_payload)

    db.session.commit()
    return material


def _resolve_uploaded_document(*, actor: User, document_id: int | None, uploaded_file: FileStorage | None) -> UploadedDocument | None:
    if uploaded_file is not None:
        saved_file = save_uploaded_file(uploaded_file, category="documents", kind="document")
        uploaded_document = UploadedDocument(
            user_id=actor.id,
            category="study-material",
            original_filename=saved_file["originalName"],
            storage_path=saved_file["storagePath"],
            content_type=saved_file["contentType"],
            size_bytes=saved_file["sizeBytes"],
        )
        db.session.add(uploaded_document)
        db.session.flush()
        return uploaded_document

    if document_id is None:
        return None

    uploaded_document = db.session.get(UploadedDocument, document_id)
    if uploaded_document is None:
        raise ApiError(404, "DOCUMENT_NOT_FOUND", "Uploaded study material document was not found.")
    if uploaded_document.user_id != actor.id and not actor.has_any_role("admin", "administration", "director", "superadmin"):
        raise ApiError(403, "FORBIDDEN", "You can only attach documents you uploaded.")
    return uploaded_document


def _has_source_payload(payload: dict[str, Any]) -> bool:
    return bool(
        payload.get("sourceText")
        or payload.get("contentText")
        or payload.get("documentId")
        or payload.get("externalUrl")
        or payload.get("imageUrls")
    )
