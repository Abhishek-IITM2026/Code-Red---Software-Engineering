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
    content_text = source.get("contentText") or ""
    source_text = source.get("sourceText") or ""
    content_preview = content_text or source_text or ""
    document = source.get("document") or {}
    class_name = material.subject.institute_class.name if material.subject and material.subject.institute_class else None
    section = material.subject.institute_class.section if material.subject and material.subject.institute_class else None
    payload.update(
        {
            "documentId": source.get("documentId"),
            "documentName": source.get("documentName"),
            "fileName": source.get("documentName"),
            "documentUrl": source.get("documentUrl"),
            "externalUrl": source.get("externalUrl"),
            "imageUrls": source.get("imageUrls") or [],
            "contentText": content_text,
            "sourceText": source_text,
            "contentTextPreview": normalize_text(content_preview)[:280] or None,
            "ragContextAvailable": bool(content_text or source_text or source.get("imageUrls")),
            "uploadedAt": document.get("createdAt"),
            "storagePath": document.get("storagePath"),
            "className": class_name,
            "section": section,
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
                "storagePath": ((source.get("document") or {}).get("storagePath")),
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
    class_name: str | None = None,
    section: str | None = None,
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
        subject=subject,
        week=week,
        class_name=class_name,
        section=section,
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


def _resolve_uploaded_document(
    *,
    actor: User,
    subject: Subject,
    week: str | None,
    class_name: str | None,
    section: str | None,
    document_id: int | None,
    uploaded_file: FileStorage | None,
) -> UploadedDocument | None:
    if uploaded_file is not None:
        path_segments = _material_storage_segments(
            subject=subject,
            week=week,
            class_name=class_name,
            section=section,
        )
        saved_file = save_uploaded_file(
            uploaded_file,
            category="documents",
            kind="document",
            path_segments=path_segments,
        )
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


def _material_storage_segments(
    *,
    subject: Subject,
    week: str | None,
    class_name: str | None,
    section: str | None,
) -> list[str]:
    institute_class = subject.institute_class
    resolved_class_name = class_name or (institute_class.name if institute_class is not None else None) or "unassigned-class"
    resolved_section = section or (institute_class.section if institute_class and institute_class.section else None)
    class_segment = resolved_class_name if not resolved_section else f"{resolved_class_name}-{resolved_section}"
    week_segment = week or "general"
    return [class_segment, subject.name, week_segment]
