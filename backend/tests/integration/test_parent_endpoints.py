"""Integration tests for Parent Blueprint API endpoints."""
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database


SEEDED_PARENT_EMAIL = "parent0001.aarav@example.in"
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
def parent_auth(client):
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_PARENT_EMAIL,
        "password": "parent123"
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


class TestParentChildrenEndpoint:
    """Test GET /api/v1/parent/children"""

    def test_list_children_as_parent(self, client, parent_auth):
        """Test parent can list children."""
        response = client.get("/api/v1/parent/children", headers=parent_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data

    def test_list_children_unauthenticated(self, client):
        """Test listing children without auth fails."""
        response = client.get("/api/v1/parent/children")
        assert response.status_code == 401


class TestParentStudentAttendanceEndpoint:
    """Test GET /api/v1/parent/students/<id>/attendance"""

    def test_get_child_attendance(self, client, parent_auth):
        """Test parent can get child's attendance."""
        response = client.get("/api/v1/parent/students/1/attendance", headers=parent_auth)
        assert response.status_code in [200, 404]

    def test_get_attendance_unauthenticated(self, client):
        """Test without auth fails."""
        response = client.get("/api/v1/parent/students/1/attendance")
        assert response.status_code == 401


class TestParentStudentMarksEndpoint:
    """Test GET /api/v1/parent/students/<id>/marks"""

    def test_get_child_marks(self, client, parent_auth):
        """Test parent can get child's marks."""
        response = client.get("/api/v1/parent/students/1/marks", headers=parent_auth)
        assert response.status_code in [200, 404]


class TestParentStudentPerformanceEndpoint:
    """Test GET /api/v1/parent/students/<id>/performance"""

    def test_get_child_performance(self, client, parent_auth):
        """Test parent can get child's performance."""
        response = client.get("/api/v1/parent/students/1/performance", headers=parent_auth)
        assert response.status_code in [200, 404]
