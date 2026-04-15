import pytest
from app.models import Subject, Material
from app.repositories.material_sources import MaterialSourceRepository

BASE_AI = "/api/v1/ai/modify-questions"

def _seed_materials_for_test(app, subject_id=1):
    with app.app_context():
        subject = Subject.query.get(subject_id)
        if not subject:
            return []

        materials = Material.query.filter_by(subject_id=subject_id).all()
        if not materials:
            # Create a dummy material if none exist
            material = Material(
                subject_id=subject_id,
                title="Test Material",
                material_type="document",
                description="Test description"
            )
            app.db.session.add(material)
            app.db.session.commit()
            materials = [material]

        repository = MaterialSourceRepository()
        for material in materials:
            repository.upsert(
                material.id,
                {
                    "contentText": f"This is test content for {material.title}. It covers the basics of the subject.",
                    "sourceText": f"Reference text for {material.title}.",
                    "documentName": f"{material.title}.pdf",
                    "documentUrl": f"https://example.com/{material.id}.pdf",
                },
            )
        return materials

class TestModifyQuestionsUnit:
    """Unit tests for the modify-questions AI endpoint focusing on RAG grounding."""

    def test_modify_questions_with_rag_success(self, client, faculty_auth_header, app):
        """Test that modifying questions with valid subject_id and materials succeeds."""
        materials = _seed_materials_for_test(app)
        material_ids = [{"id": str(m.id)} for m in materials]

        response = client.post(
            BASE_AI,
            json={
                "questions": [
                    {
                        "id": "q-1",
                        "questionText": "What is the capital of France?",
                        "questionType": "short",
                        "marks": 5,
                        "difficulty": "easy",
                    }
                ],
                "modificationPrompt": "Make it more technical based on materials",
                "subjectId": "1",
                "materials": material_ids,
            },
            headers=faculty_auth_header,
        )

        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "questionText" in data[0]

    def test_modify_questions_with_only_subject_id_success(self, client, faculty_auth_header, app):
        """Test that providing only subject_id correctly hydrates materials and succeeds."""
        _seed_materials_for_test(app)

        response = client.post(
            BASE_AI,
            json={
                "questions": [
                    {
                        "id": "q-1",
                        "questionText": "Original question",
                        "questionType": "short",
                        "marks": 5,
                    }
                ],
                "modificationPrompt": "Simplify this",
                "subjectId": "1",
            },
            headers=faculty_auth_header,
        )

        assert response.status_code == 200
        assert isinstance(response.get_json(), list)

    def test_modify_questions_no_subject_no_materials_success(self, client, faculty_auth_header):
        """Test that modification still works (heuristic fallback) when no RAG context is provided."""
        response = client.post(
            BASE_AI,
            json={
                "questions": [
                    {
                        "id": "q-1",
                        "questionText": "General question",
                        "questionType": "short",
                        "marks": 5,
                    }
                ],
                "modificationPrompt": "Make it harder",
            },
            headers=faculty_auth_header,
        )

        assert response.status_code == 200
        data = response.get_json()
        assert data[0]["difficulty"] == "hard"

    def test_modify_questions_invalid_subject_id_fallback(self, client, faculty_auth_header):
        """Test that an invalid subject_id doesn't crash the server (falls back to heuristic)."""
        response = client.post(
            BASE_AI,
            json={
                "questions": [
                    {
                        "id": "q-1",
                        "questionText": "Test question",
                        "questionType": "short",
                        "marks": 5,
                    }
                ],
                "modificationPrompt": "Modify this",
                "subjectId": "999999",
            },
            headers=faculty_auth_header,
        )

        assert response.status_code == 200
        assert isinstance(response.get_json(), list)
