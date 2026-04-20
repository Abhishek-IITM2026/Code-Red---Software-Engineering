"""Integration tests for Schedule Blueprint API endpoints."""
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database


SEEDED_FACULTY_EMAIL = "faculty001.aarav@example.in"
SEEDED_ADMIN_EMAIL = "admin@example.in"
SEEDED_STUDENT_EMAIL = "student0001.aarav@example.in"


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


@pytest.fixture
def student_auth(client):
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_STUDENT_EMAIL,
        "password": "student123"
    })
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


class TestScheduleListEndpoint:
    """Test GET /api/v1/schedule"""

    def test_list_schedule_as_faculty(self, client, faculty_auth):
        """Test faculty can list schedule."""
        response = client.get("/api/v1/schedule", headers=faculty_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data

    def test_list_schedule_as_admin(self, client, admin_auth):
        """Test admin can list schedule."""
        response = client.get("/api/v1/schedule", headers=admin_auth)
        assert response.status_code == 200

    def test_list_schedule_as_student(self, client, student_auth):
        """Test student can list schedule."""
        response = client.get("/api/v1/schedule", headers=student_auth)
        assert response.status_code == 200

    def test_list_schedule_unauthenticated(self, client):
        """Test listing schedule without auth fails."""
        response = client.get("/api/v1/schedule")
        assert response.status_code == 401


class TestScheduleByClassEndpoint:
    """Test GET /api/v1/schedule/class/<id>"""

    def test_get_schedule_by_class(self, client, admin_auth):
        """Test getting schedule by class."""
        response = client.get("/api/v1/schedule/class/1", headers=admin_auth)
        assert response.status_code == 200

    def test_get_schedule_by_class_with_date(self, client, admin_auth):
        """Test getting schedule with date filter."""
        response = client.get("/api/v1/schedule/class/1?date=2024-05-01", headers=admin_auth)
        assert response.status_code == 200


class TestScheduleByFacultyEndpoint:
    """Test GET /api/v1/schedule/faculty/<id>"""

    def test_get_schedule_by_faculty(self, client, admin_auth):
        """Test getting schedule by faculty."""
        response = client.get("/api/v1/schedule/faculty/1", headers=admin_auth)
        assert response.status_code == 200
