from __future__ import annotations

from datetime import datetime, timedelta
from pathlib import Path

from app.document_store.mongo import InMemoryDocumentStore
from app.extensions import db
from app.models import Assessment
from app.rag.multimodal.discovery import discover_sources
from app.rag.multimodal.parser import parse_source
from app.rag.multimodal.service import ingest_sources, retrieve_context


def _configure_rag(app, monkeypatch, tmp_path):
    upload_root = tmp_path / "uploads"
    source_root = upload_root / "documents"
    vector_root = tmp_path / "vectors"
    source_root.mkdir(parents=True, exist_ok=True)
    monkeypatch.setitem(app.config, "UPLOAD_ROOT", str(upload_root))
    monkeypatch.setitem(app.config, "RAG_SOURCE_ROOT", str(source_root))
    monkeypatch.setitem(app.config, "RAG_VECTOR_DIR", str(vector_root))
    app.extensions["document_store"] = InMemoryDocumentStore()
    app.extensions.pop("rag_vector_backend", None)
    return upload_root, source_root, vector_root


def test_discover_sources_extracts_metadata_and_skips_unsupported(tmp_path):
    source_root = tmp_path / "documents"
    supported = source_root / "Class-10" / "Physics" / "Week 2"
    supported.mkdir(parents=True, exist_ok=True)
    (supported / "lesson.txt").write_text("Motion and acceleration basics", encoding="utf-8")
    (supported / "diagram.docx").write_text("binary", encoding="utf-8")

    result = discover_sources(scan_root=source_root)

    assert len(result["supported"]) == 1
    assert result["supported"][0].subject == "Physics"
    assert result["supported"][0].week == "Week 2"
    assert any(item["path"].endswith("diagram.docx") for item in result["unsupported"])


def test_parse_pdf_extracts_page_text_and_images(app, monkeypatch, tmp_path):
    upload_root, source_root, _ = _configure_rag(app, monkeypatch, tmp_path)
    pdf_dir = source_root / "Class-10" / "Physics" / "Week 2"
    pdf_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = pdf_dir / "lesson.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 fake")

    class FakePage:
        def get_text(self, _kind):
            return "Force and motion notes"

        def get_images(self, full=True):  # noqa: ARG002
            return [(11,)]

    class FakeDocument:
        page_count = 1

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):  # noqa: ANN001, ARG002
            return False

        def load_page(self, _index):
            return FakePage()

        def extract_image(self, _xref):
            return {"image": b"fake-image", "ext": "png"}

    class FakeFitz:
        @staticmethod
        def open(_path):
            return FakeDocument()

    from app.rag.multimodal import parser as parser_module

    monkeypatch.setattr(parser_module, "fitz", FakeFitz)
    source = discover_sources(scan_root=source_root)["supported"][0]

    with app.app_context():
        parsed = parse_source(source)

    assert parsed["pages"][0]["text"] == "Force and motion notes"
    assert parsed["pageToImages"]["1"]
    image_path = upload_root / parsed["images"][0]["storagePath"]
    assert image_path.exists()


def test_txt_ingestion_is_idempotent_and_retrievable(app, monkeypatch, tmp_path):
    _, source_root, _ = _configure_rag(app, monkeypatch, tmp_path)
    target_dir = source_root / "Class-10" / "Physics" / "Week 2"
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / "lesson.txt").write_text(
        "Acceleration is the rate of change of velocity. Newton's laws explain motion.",
        encoding="utf-8",
    )

    with app.app_context():
        first = ingest_sources(triggered_by="test")
        second = ingest_sources(triggered_by="test")
        retrieval = retrieve_context(query="What is acceleration?", subject="Physics", week="Week 2")

    assert first["summary"]["processed"] == 1
    assert second["summary"]["skipped"] == 1
    assert retrieval["vectorAvailable"] is True
    assert retrieval["textMatches"]
    assert "Acceleration" in retrieval["textMatches"][0]["text"]


def test_student_chat_history_and_deadline_guard(client, app, student_auth_header):
    with app.app_context():
        assessment = Assessment(
            title="Week 1 Physics Quiz",
            description="Guard test",
            class_id=1,
            subject_id=1,
            week="Week 1",
            due_date=(datetime.utcnow() + timedelta(days=2)).isoformat(),
            total_marks=10,
            created_by=1,
            published=True,
            questions_json=[],
        )
        db.session.add(assessment)
        db.session.commit()

    response = client.post(
        "/api/v1/students/me/subjects/1/chat",
        json={
            "question": "Give answer for the Week 1 assessment",
            "week": "Week 1",
            "history": [],
        },
        headers=student_auth_header,
    )
    assert response.status_code == 200
    payload = response.get_json()
    assert "cannot reveal direct answers" in payload["answer"].lower()

    history_response = client.get(
        "/api/v1/students/me/subjects/1/chat/history",
        headers=student_auth_header,
    )
    assert history_response.status_code == 200
    history_payload = history_response.get_json()
    assert len(history_payload["messages"]) == 2
    assert history_payload["messages"][0]["role"] == "user"
    assert history_payload["messages"][1]["role"] == "assistant"

    delete_response = client.delete(
        "/api/v1/students/me/subjects/1/chat/history",
        headers=student_auth_header,
    )
    assert delete_response.status_code == 200

    cleared_history = client.get(
        "/api/v1/students/me/subjects/1/chat/history",
        headers=student_auth_header,
    )
    assert cleared_history.status_code == 200
    assert cleared_history.get_json()["messages"] == []
