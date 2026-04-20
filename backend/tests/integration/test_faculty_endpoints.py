"""Integration tests for Faculty Blueprint API endpoints."""
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database


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


class TestListFacultyEndpoint:
    """Test GET /api/v1/faculty"""

    def test_list_faculty_as_admin(self, client, admin_auth):
        """Test admin can list all faculty."""
        response = client.get("/api/v1/faculty", headers=admin_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_list_faculty_as_faculty(self, client, faculty_auth):
        """Test faculty can see own profile."""
        response = client.get("/api/v1/faculty", headers=faculty_auth)
        assert response.status_code == 200

    def test_list_faculty_unauthenticated(self, client):
        """Test listing faculty without auth fails."""
        response = client.get("/api/v1/faculty")
        assert response.status_code == 401


class TestFacultyClassesEndpoint:
    """Test GET /api/v1/faculty/classes"""

    def test_get_faculty_classes(self, client, faculty_auth):
        """Test faculty can get assigned classes."""
        response = client.get("/api/v1/faculty/classes", headers=faculty_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data

    def test_get_classes_as_admin(self, client, admin_auth):
        """Test admin can get faculty classes."""
        response = client.get("/api/v1/faculty/classes", headers=admin_auth)
        assert response.status_code == 200


class TestFacultyClassesOverviewEndpoint:
    """Test GET /api/v1/faculty/classes/overview"""

    def test_get_classes_overview(self, client, faculty_auth):
        """Test faculty can get classes overview."""
        response = client.get("/api/v1/faculty/classes/overview", headers=faculty_auth)
        assert response.status_code == 200

    def test_get_overview_as_admin(self, client, admin_auth):
        """Test admin can get classes overview."""
        response = client.get("/api/v1/faculty/classes/overview", headers=admin_auth)
        assert response.status_code == 200


class TestFacultyUpcomingCoursesEndpoint:
    """Test GET /api/v1/faculty/upcoming-courses"""

    def test_get_upcoming_courses(self, client, faculty_auth):
        """Test faculty can get upcoming courses."""
        response = client.get("/api/v1/faculty/upcoming-courses", headers=faculty_auth)
        assert response.status_code == 200

    def test_get_courses_unauthenticated(self, client):
        """Test without auth fails."""
        response = client.get("/api/v1/faculty/upcoming-courses")
        assert response.status_code == 401


class TestFacultyStudentPerformanceEndpoint:
    """Test GET /api/v1/faculty/performance/students"""

    def test_get_student_performance(self, client, faculty_auth):
        """Test faculty can get student performance."""
        response = client.get("/api/v1/faculty/performance/students", headers=faculty_auth)
        assert response.status_code == 200

    def test_get_performance_as_admin(self, client, admin_auth):
        """Test admin can get student performance."""
        response = client.get("/api/v1/faculty/performance/students", headers=admin_auth)
        assert response.status_code == 200

    def test_get_performance_with_class_filter(self, client, faculty_auth):
        """Test getting performance with class filter."""
        response = client.get("/api/v1/faculty/performance/students?classId=1", headers=faculty_auth)
        assert response.status_code == 200