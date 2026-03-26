def test_generate_questions(faculty_auth_header, client):
    response = client.post(
        "/api/v1/ai/generate-questions",
        json={"subjectId": "1", "questionCount": 2, "totalMarks": 10, "difficultyLevel": "medium"},
        headers=faculty_auth_header,
    )

    assert response.status_code == 200
    assert len(response.get_json()) == 2


def test_publish_assessment(faculty_auth_header, client):
    response = client.post("/api/v1/assessments/1/publish", headers=faculty_auth_header)

    assert response.status_code == 200
    assert response.get_json()["published"] is True


def test_create_assessment_returns_document_id(faculty_auth_header, client):
    response = client.post(
        "/api/v1/assessments",
        json={
            "title": "Geometry Quiz",
            "description": "Quiz on triangles",
            "classId": 1,
            "subjectId": 1,
            "questions": [
                {
                    "id": "q1",
                    "questionText": "What is the sum of angles in a triangle?",
                    "questionType": "short",
                    "marks": 5,
                    "difficulty": "easy",
                }
            ],
            "totalMarks": 5,
            "createdBy": 3,
            "dueDate": "2026-04-10",
            "published": False,
        },
        headers=faculty_auth_header,
    )

    assert response.status_code == 201
    payload = response.get_json()
    assert payload["questionsDocumentId"]
    assert payload["questions"][0]["questionText"] == "What is the sum of angles in a triangle?"


def test_generate_questions_rejects_invalid_payload(faculty_auth_header, client):
    response = client.post(
        "/api/v1/ai/generate-questions",
        json={"subjectId": "1", "questionCount": 2, "totalMarks": 10, "difficultyLevel": "medium", "extra": True},
        headers=faculty_auth_header,
    )

    assert response.status_code == 422
    assert response.get_json()["error"]["code"] == "VALIDATION_ERROR"
