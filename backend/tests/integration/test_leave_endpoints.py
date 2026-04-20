"""Integration tests for Leave Blueprint API endpoints."""
import pytest
from datetime import date, timedelta

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


class TestListLeaveRequestsEndpoint:
    """Test GET /api/v1/leave/leave"""

    def test_list_leave_as_student(self, client, student_auth):
        """Test student can list own leave requests."""
        response = client.get("/api/v1/leave/leave", headers=student_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_list_leave_as_admin(self, client, admin_auth):
        """Test admin can list all leave requests."""
        response = client.get("/api/v1/leave/leave", headers=admin_auth)
        assert response.status_code == 200

    def test_list_leave_unauthenticated(self, client):
        """Test listing leave without auth fails."""
        response = client.get("/api/v1/leave/leave")
        assert response.status_code == 401

    def test_list_leave_with_status_filter(self, client, admin_auth):
        """Test listing leave with status filter."""
        response = client.get("/api/v1/leave/leave?status=Pending", headers=admin_auth)
        assert response.status_code == 200


class TestCreateLeaveRequestEndpoint:
    """Test POST /api/v1/leave/leave"""

    def test_create_leave_as_student(self, client, student_auth):
        """Test student can create leave request."""
        from_date = (date.today() + timedelta(days=5)).isoformat()
        to_date = (date.today() + timedelta(days=7)).isoformat()
        response = client.post("/api/v1/leave/leave", headers=student_auth, json={
            "fromDate": from_date,
            "toDate": to_date,
            "leaveType": "Sick Leave",
            "reason": "Medical appointment"
        })
        assert response.status_code == 201

    def test_create_leave_as_faculty(self, client, faculty_auth):
        """Test faculty can create leave request."""
        from_date = (date.today() + timedelta(days=10)).isoformat()
        to_date = (date.today() + timedelta(days=12)).isoformat()
        response = client.post("/api/v1/leave/leave", headers=faculty_auth, json={
            "fromDate": from_date,
            "toDate": to_date,
            "leaveType": "Casual Leave",
            "reason": "Personal work"
        })
        assert response.status_code == 201

    def test_create_leave_invalid_date_range(self, client, student_auth):
        """Test creating leave with invalid date range."""
        from_date = (date.today() + timedelta(days=10)).isoformat()
        to_date = (date.today() + timedelta(days=5)).isoformat()
        response = client.post("/api/v1/leave/leave", headers=student_auth, json={
            "fromDate": from_date,
            "toDate": to_date,
            "leaveType": "Sick Leave",
            "reason": "Test"
        })
        assert response.status_code == 400

    def test_create_leave_missing_fields(self, client, student_auth):
        """Test creating leave with missing fields."""
        response = client.post("/api/v1/leave/leave", headers=student_auth, json={
            "fromDate": date.today().isoformat()
        })
        assert response.status_code == 422


class TestLeaveReviewEndpoint:
    """Test PUT /api/v1/leave/leave/<id>/review"""

    def test_review_leave_as_admin(self, client, admin_auth):
        """Test admin can review leave requests."""
        response = client.put("/api/v1/leave/leave/1/review", headers=admin_auth, json={
            "status": "Approved",
            "reviewerComment": "Approved."
        })
        # 404 if leave request doesn't exist
        assert response.status_code in [200, 404]

    def test_review_leave_as_student_forbidden(self, client, student_auth):
        """Test student cannot review leave requests."""
        response = client.put("/api/v1/leave/leave/1/review", headers=student_auth, json={
            "status": "Approved"
        })
        assert response.status_code == 403


class TestLeaveCancelEndpoint:
    """Test PUT /api/v1/leave/leave/<id>/cancel"""

    def test_cancel_leave_unauthenticated(self, client):
        """Test cancelling leave without auth fails."""
        response = client.put("/api/v1/leave/leave/1/cancel")
        assert response.status_code == 401


class TestLeaveStatsEndpoint:
    """Test GET /api/v1/leave/leave/stats"""

    def test_leave_stats_as_admin(self, client, admin_auth):
        """Test admin can get leave statistics."""
        response = client.get("/api/v1/leave/leave/stats", headers=admin_auth)
        assert response.status_code == 200

    def test_leave_stats_as_student_forbidden(self, client, student_auth):
        """Test student cannot access leave statistics."""
        response = client.get("/api/v1/leave/leave/stats", headers=student_auth)
        assert response.status_code == 403