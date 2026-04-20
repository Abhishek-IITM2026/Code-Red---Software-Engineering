"""Integration tests for Marks Blueprint API endpoints."""
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database


SEEDED_STUDENT_EMAIL = "student0001.aarav@example.in"
SEEDED_FACULTY_EMAIL = "faculty001.aarav@example.in"
SEEDED_ADMIN_EMAIL = "admin@example.in"


@pytest.fixture(scope="module")
def app():
    app = create_app("testing")
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed_database(force=True)
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def student_auth(client):
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_STUDENT_EMAIL,
        "password": "student123"
    })
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


@pytest.fixture
def faculty_auth(client):
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_FACULTY_EMAIL,
        "password": "faculty123"
    })
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


@pytest.fixture
def admin_auth(client):
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_ADMIN_EMAIL,
        "password": "admin123"
    })
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


class TestListMarksEndpoint:
    """Test GET /api/v1/marks"""

    def test_list_marks_as_student(self, client, student_auth):
        """Test student can get own marks."""
        response = client.get("/api/v1/marks", headers=student_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_list_marks_as_faculty(self, client, faculty_auth):
        """Test faculty can get marks."""
        response = client.get("/api/v1/marks", headers=faculty_auth)
        assert response.status_code == 200

    def test_list_marks_as_admin(self, client, admin_auth):
        """Test admin can get all marks."""
        response = client.get("/api/v1/marks", headers=admin_auth)
        assert response.status_code == 200

    def test_list_marks_unauthenticated(self, client):
        """Test getting marks without auth fails."""
        response = client.get("/api/v1/marks")
        assert response.status_code == 401

    def test_list_marks_with_exam_type_filter(self, client, admin_auth):
        """Test getting marks filtered by exam type."""
        response = client.get("/api/v1/marks?examType=Unit Test", headers=admin_auth)
        assert response.status_code == 200

    def test_list_marks_with_subject_filter(self, client, admin_auth):
        """Test getting marks filtered by subject."""
        response = client.get("/api/v1/marks?subjectId=1", headers=admin_auth)
        assert response.status_code == 200


class TestStudentMarksEndpoint:
    """Test GET /api/v1/marks with student context"""

    def test_student_can_only_see_own_marks(self, client, student_auth):
        """Test student cannot see other students marks."""
        response = client.get("/api/v1/marks?studentId=999", headers=student_auth)
        assert response.status_code == 403

    def test_student_can_view_own_marks(self, client, student_auth):
        """Test student can view own marks without filter."""
        response = client.get("/api/v1/marks", headers=student_auth)
        assert response.status_code == 200