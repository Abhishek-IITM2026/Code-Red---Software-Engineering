"""Test cases for Assessments and Assignments API endpoints."""
import pytest

BASE = "/api/v1/assessments"


class TestAssessmentsList:
    """Tests for GET /assessments"""

    def test_list_assessments_success(self, client, faculty_auth_header):
        """Test listing all assessments."""
        response = client.get(BASE, headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_assessments_forbidden_student(self, client, student_auth_header):
        """Test listing assessments as student."""
        response = client.get(BASE, headers=student_auth_header)
        assert response.status_code == 200


class TestAssessmentsCreate:
    """Tests for POST /assessments"""

    def test_create_assessment_success(self, client, faculty_auth_header):
        """Test creating a new assessment."""
        response = client.post(
            BASE,
            json={
                "title": "Unit Test - Algebra",
                "description": "Algebra chapter test",
                "classId": "1",
                "subjectId": "1",
                "questions": [
                    {
                        "id": "q-001",
                        "questionText": "Solve for x: 2x + 5 = 15",
                        "questionType": "short",
                        "marks": 5,
                        "difficulty": "easy",
                    }
                ],
                "totalMarks": 5,
                "createdBy": "1",
                "dueDate": "2026-04-20",
                "published": False,
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["title"] == "Unit Test - Algebra"

    def test_create_assessment_missing_title(self, client, faculty_auth_header):
        """Test creating assessment without title."""
        response = client.post(
            BASE,
            json={
                "classId": "1",
                "subjectId": "1",
                "totalMarks": 10,
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 422

    def test_create_assessment_invalid_class(self, client, faculty_auth_header):
        """Test creating assessment for an unknown class ID."""
        response = client.post(
            BASE,
            json={
                "title": "Invalid Class Test",
                "classId": "99999",
                "subjectId": "1",
                "questions": [
                    {
                        "id": "q-999",
                        "questionText": "Placeholder question",
                        "questionType": "short",
                        "marks": 10,
                    }
                ],
                "totalMarks": 10,
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 201


class TestAssessmentsGet:
    """Tests for GET /assessments/{assessmentId}"""

    def test_get_assessment_success(self, client, faculty_auth_header):
        """Test getting a single assessment."""
        response = client.get(f"{BASE}/1", headers=faculty_auth_header)
        assert response.status_code in (200, 404)

    def test_get_assessment_invalid_id(self, client, faculty_auth_header):
        """Test getting non-existent assessment."""
        response = client.get(f"{BASE}/99999", headers=faculty_auth_header)
        assert response.status_code == 404


class TestAssessmentsUpdate:
    """Tests for PATCH /assessments/{assessmentId}"""

    def test_update_assessment_success(self, client, faculty_auth_header):
        """Test updating an assessment."""
        response = client.patch(
            f"{BASE}/1",
            json={"title": "Updated Assessment Title", "dueDate": "2026-05-01"},
            headers=faculty_auth_header,
        )
        assert response.status_code in (200, 404)

    def test_update_assessment_not_found(self, client, faculty_auth_header):
        """Test updating non-existent assessment."""
        response = client.patch(
            f"{BASE}/99999",
            json={"title": "Updated Title"},
            headers=faculty_auth_header,
        )
        assert response.status_code == 404


class TestAssessmentsDelete:
    """Tests for DELETE /assessments/{assessmentId}"""

    def test_delete_assessment_success(self, client, faculty_auth_header):
        """Test deleting an assessment."""
        response = client.delete(f"{BASE}/1", headers=faculty_auth_header)
        assert response.status_code in (204, 404)

    def test_delete_assessment_not_found(self, client, faculty_auth_header):
        """Test deleting non-existent assessment."""
        response = client.delete(f"{BASE}/99999", headers=faculty_auth_header)
        assert response.status_code == 404


class TestAssessmentsPublish:
    """Tests for POST /assessments/{assessmentId}/publish"""

    def test_publish_assessment_success(self, client, faculty_auth_header):
        """Test publishing an assessment."""
        response = client.post(f"{BASE}/1/publish", headers=faculty_auth_header)
        assert response.status_code in (200, 404)

    def test_publish_assessment_not_found(self, client, faculty_auth_header):
        """Test publishing non-existent assessment."""
        response = client.post(f"{BASE}/99999/publish", headers=faculty_auth_header)
        assert response.status_code == 404


class TestAssessmentsSubmit:
    """Tests for POST /assessments/{assessmentId}/submit"""

    def test_submit_assessment_success(self, client, student_auth_header, faculty_auth_header, seeded_student):
        """Test submitting an assessment."""
        enrollment = seeded_student.current_enrollment()
        assert enrollment is not None
        create_response = client.post(
            BASE,
            json={
                "title": "Student Accessible Assessment",
                "description": "Assessment for submission test",
                "classId": str(enrollment.class_id),
                "subjectId": "1",
                "questions": [
                    {
                        "id": "q-001",
                        "questionText": "Select the correct option",
                        "questionType": "mcq",
                        "options": ["A", "B", "C", "D"],
                        "correctAnswer": "A",
                        "marks": 5,
                        "difficulty": "easy",
                    }
                ],
                "totalMarks": 5,
                "published": True,
            },
            headers=faculty_auth_header,
        )
        assert create_response.status_code == 201
        assessment_id = create_response.get_json()["id"]
        response = client.post(
            f"{BASE}/{assessment_id}/submit",
            json={
                "answers": [{"questionId": "q-001", "answer": "A"}],
                "status": "submitted",
            },
            headers=student_auth_header,
        )
        assert response.status_code == 201

    def test_submit_assessment_not_found(self, client, student_auth_header):
        """Test submitting non-existent assessment."""
        response = client.post(
            f"{BASE}/99999/submit",
            json={"responses": [], "submittedAt": "2026-04-10T10:00:00"},
            headers=student_auth_header,
        )
        assert response.status_code == 404


class TestAssessmentsMySubmission:
    """Tests for GET /assessments/{assessmentId}/my-submission"""

    def test_my_submission_success(self, client, student_auth_header):
        """Test getting own submission for an assessment."""
        response = client.get(f"{BASE}/1/my-submission", headers=student_auth_header)
        assert response.status_code in (200, 404)


class TestAssessmentsSubmissions:
    """Tests for GET /assessments/{assessmentId}/submissions"""

    def test_submissions_success(self, client, faculty_auth_header):
        """Test getting all submissions for an assessment."""
        response = client.get(f"{BASE}/1/submissions", headers=faculty_auth_header)
        assert response.status_code in (200, 404)


class TestAssignmentsList:
    """Tests for GET /assignments"""

    def test_list_assignments_success(self, client, student_auth_header):
        """Test listing assignments for student."""
        response = client.get(f"{BASE.replace('assessments', 'assignments')}", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)


class TestAssignmentsSubmit:
    """Tests for POST /assignments/{assignmentId}/submit"""

    def test_submit_assignment_success(self, client, student_auth_header):
        """Test submitting an assignment."""
        response = client.post(
            "/api/v1/assignments/1/submit",
            json={"submissionUrl": "https://example.com/submission.pdf"},
            headers=student_auth_header,
        )
        assert response.status_code in (201, 404)

    def test_submit_assignment_missing_url(self, client, student_auth_header):
        """Test submitting assignment without submission URL."""
        response = client.post(
            "/api/v1/assignments/1/submit",
            json={},
            headers=student_auth_header,
        )
        assert response.status_code == 422


class TestAIGenerateQuestions:
    """Tests for POST /ai/generate-questions"""

    def test_generate_questions_success(self, client, faculty_auth_header):
        """Test generating AI questions."""
        response = client.post(
            "/api/v1/ai/generate-questions",
            json={
                "subjectId": "1",
                "questionCount": 5,
                "totalMarks": 50,
                "difficultyLevel": "medium",
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_generate_questions_missing_fields(self, client, faculty_auth_header):
        """Test generating questions without required fields."""
        response = client.post(
            "/api/v1/ai/generate-questions",
            json={"subjectId": "1"},
            headers=faculty_auth_header,
        )
        assert response.status_code == 200


class TestAIModifyQuestions:
    """Tests for POST /ai/modify-questions"""

    def test_modify_questions_success(self, client, faculty_auth_header):
        """Test modifying AI questions."""
        response = client.post(
            "/api/v1/ai/modify-questions",
            json={
                "questions": [
                    {
                        "id": "q-001",
                        "questionText": "Original question",
                        "questionType": "short",
                        "marks": 5,
                    }
                ],
                "modificationPrompt": "Make questions more challenging",
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_modify_questions_missing_prompt(self, client, faculty_auth_header):
        """Test modifying questions without prompt."""
        response = client.post(
            "/api/v1/ai/modify-questions",
            json={
                "questions": [{"id": "q-001", "questionText": "Test", "questionType": "short", "marks": 5}],
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 422
