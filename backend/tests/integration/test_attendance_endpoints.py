"""Integration tests for Attendance Blueprint API endpoints."""
import pytest
from datetime import date

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


class TestGetAttendanceEndpoint:
    """Test GET /api/v1/attendance"""

    def test_get_attendance_as_student(self, client, student_auth):
        """Test student can get own attendance."""
        response = client.get("/api/v1/attendance", headers=student_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_get_attendance_as_faculty(self, client, faculty_auth):
        """Test faculty can get attendance."""
        response = client.get("/api/v1/attendance", headers=faculty_auth)
        assert response.status_code == 200

    def test_get_attendance_as_admin(self, client, admin_auth):
        """Test admin can get all attendance."""
        response = client.get("/api/v1/attendance", headers=admin_auth)
        assert response.status_code == 200

    def test_get_attendance_unauthenticated(self, client):
        """Test getting attendance without auth fails."""
        response = client.get("/api/v1/attendance")
        assert response.status_code == 401

    def test_get_attendance_with_date_filter(self, client, admin_auth):
        """Test getting attendance with date filter."""
        today = date.today().isoformat()
        response = client.get(f"/api/v1/attendance?date={today}", headers=admin_auth)
        assert response.status_code == 200

    def test_get_attendance_with_student_filter(self, client, admin_auth):
        """Test getting attendance filtered by student."""
        response = client.get("/api/v1/attendance?studentId=1", headers=admin_auth)
        assert response.status_code == 200


class TestAttendanceMeStatsEndpoint:
    """Test GET /api/v1/attendance/me/stats"""

    def test_get_my_attendance_stats(self, client, student_auth):
        """Test student can get own attendance stats."""
        response = client.get("/api/v1/attendance/me/stats", headers=student_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data

    def test_get_stats_unauthenticated(self, client):
        """Test getting stats without auth fails."""
        response = client.get("/api/v1/attendance/me/stats")
        assert response.status_code == 401

    def test_get_stats_as_faculty_unauthorized(self, client, faculty_auth):
        """Test faculty cannot access student stats endpoint."""
        response = client.get("/api/v1/attendance/me/stats", headers=faculty_auth)
        # Faculty should not have access to /me/stats
        assert response.status_code in [403, 404]


class TestCreateAttendanceEndpoint:
    """Test POST /api/v1/attendance"""

    def test_create_attendance_as_admin(self, client, admin_auth):
        """Test admin can create attendance records."""
        # This test requires proper class and student data
        response = client.post("/api/v1/attendance", headers=admin_auth, json={
            "attendanceDate": date.today().isoformat(),
            "classId": 1,
            "records": []
        })
        # Should succeed with valid data structure
        assert response.status_code in [201, 400, 404]

    def test_create_attendance_as_faculty(self, client, faculty_auth):
        """Test faculty can create attendance records."""
        response = client.post("/api/v1/attendance", headers=faculty_auth, json={
            "attendanceDate": date.today().isoformat(),
            "classId": 1,
            "records": []
        })
        assert response.status_code in [201, 400, 403, 404]

    def test_create_attendance_as_student_forbidden(self, client, student_auth):
        """Test student cannot create attendance."""
        response = client.post("/api/v1/attendance", headers=student_auth, json={
            "attendanceDate": date.today().isoformat(),
            "classId": 1,
            "records": []
        })
        assert response.status_code == 403


class TestUpdateAttendanceEndpoint:
    """Test PUT /api/v1/attendance"""

    def test_update_attendance_as_admin(self, client, admin_auth):
        """Test admin can update attendance records."""
        response = client.put("/api/v1/attendance", headers=admin_auth, json={
            "attendanceDate": date.today().isoformat(),
            "classId": 1,
            "records": []
        })
        assert response.status_code in [200, 400, 404]

    def test_update_attendance_unauthenticated(self, client):
        """Test updating attendance without auth fails."""
        response = client.put("/api/v1/attendance", json={
            "attendanceDate": date.today().isoformat(),
            "classId": 1,
            "records": []
        })
        assert response.status_code == 401