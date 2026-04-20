"""Integration tests for Students Blueprint API endpoints."""
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


class TestListStudentsEndpoint:
    """Test GET /api/v1/students"""

    def test_list_students_as_faculty(self, client, faculty_auth):
        """Test faculty can list students."""
        response = client.get("/api/v1/students", headers=faculty_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_list_students_as_admin(self, client, admin_auth):
        """Test admin can list students."""
        response = client.get("/api/v1/students", headers=admin_auth)
        assert response.status_code == 200

    def test_list_students_unauthenticated(self, client):
        """Test listing students without auth fails."""
        response = client.get("/api/v1/students")
        assert response.status_code == 401

    def test_list_students_with_class_filter(self, client, faculty_auth):
        """Test listing students with class filter."""
        response = client.get("/api/v1/students?class=Class 1", headers=faculty_auth)
        assert response.status_code == 200

    def test_list_students_with_section_filter(self, client, faculty_auth):
        """Test listing students with section filter."""
        response = client.get("/api/v1/students?section=A", headers=faculty_auth)
        assert response.status_code == 200


class TestStudentMeEndpoint:
    """Test GET /api/v1/students/me"""

    def test_get_me_as_student(self, client, student_auth):
        """Test student can get own profile."""
        response = client.get("/api/v1/students/me", headers=student_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data

    def test_get_me_unauthenticated(self, client):
        """Test getting own profile without auth fails."""
        response = client.get("/api/v1/students/me")
        assert response.status_code == 401


class TestStudentSubjectsEndpoint:
    """Test GET /api/v1/students/me/subjects"""

    def test_get_my_subjects(self, client, student_auth):
        """Test student can get enrolled subjects."""
        response = client.get("/api/v1/students/me/subjects", headers=student_auth)
        assert response.status_code == 200

    def test_get_my_subjects_unauthenticated(self, client):
        """Test getting subjects without auth fails."""
        response = client.get("/api/v1/students/me/subjects")
        assert response.status_code == 401


class TestStudentPerformanceEndpoint:
    """Test GET /api/v1/students/me/performance"""

    def test_get_my_performance(self, client, student_auth):
        """Test student can get own performance."""
        response = client.get("/api/v1/students/me/performance", headers=student_auth)
        assert response.status_code == 200

    def test_get_performance_unauthenticated(self, client):
        """Test getting performance without auth fails."""
        response = client.get("/api/v1/students/me/performance")
        assert response.status_code == 401


class TestStudentCoursesEndpoint:
    """Test GET /api/v1/students/me/courses"""

    def test_get_my_courses(self, client, student_auth):
        """Test student can get enrolled courses."""
        response = client.get("/api/v1/students/me/courses", headers=student_auth)
        assert response.status_code == 200

    def test_get_my_courses_unauthenticated(self, client):
        """Test getting courses without auth fails."""
        response = client.get("/api/v1/students/me/courses")
        assert response.status_code == 401


class TestUpcomingCoursesEndpoint:
    """Test GET /api/v1/students/me/upcoming-courses"""

    def test_get_upcoming_courses(self, client, student_auth):
        """Test student can get upcoming courses."""
        response = client.get("/api/v1/students/me/upcoming-courses", headers=student_auth)
        assert response.status_code == 200

    def test_get_upcoming_courses_unauthenticated(self, client):
        """Test getting upcoming courses without auth fails."""
        response = client.get("/api/v1/students/me/upcoming-courses")
        assert response.status_code == 401


class TestCourseEnrollmentsEndpoint:
    """Test /api/v1/students/me/course-enrollments"""

    def test_list_course_enrollments(self, client, student_auth):
        """Test listing course enrollments."""
        response = client.get("/api/v1/students/me/course-enrollments", headers=student_auth)
        assert response.status_code == 200

    def test_list_enrollments_unauthenticated(self, client):
        """Test listing enrollments without auth fails."""
        response = client.get("/api/v1/students/me/course-enrollments")
        assert response.status_code == 401
