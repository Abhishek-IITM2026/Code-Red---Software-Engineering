"""Test cases for Leave API endpoints."""
import pytest

BASE = "/api/v1/leave"


class TestLeaveApply:
    """Tests for POST /leave"""

    def test_apply_leave_success(self, client, faculty_auth_header):
        """Test submitting a leave request."""
        response = client.post(
            BASE,
            json={
                "leaveType": "sick",
                "startDate": "2026-04-15",
                "endDate": "2026-04-17",
                "reason": "Medical appointment",
            },
            headers=faculty_auth_header,
        )
        assert response.status_code in (200, 201)

    def test_apply_leave_missing_type(self, client, faculty_auth_header):
        """Test applying leave without leave type."""
        response = client.post(
            BASE,
            json={
                "startDate": "2026-04-15",
                "endDate": "2026-04-17",
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 422

    def test_apply_leave_invalid_dates(self, client, faculty_auth_header):
        """Test applying leave with end date before start date."""
        response = client.post(
            BASE,
            json={
                "leaveType": "sick",
                "startDate": "2026-04-17",
                "endDate": "2026-04-15",
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 422

    def test_apply_leave_unauthenticated(self, client):
        """Test applying leave without auth."""
        response = client.post(
            BASE,
            json={"leaveType": "sick", "startDate": "2026-04-15", "endDate": "2026-04-17"},
        )
        assert response.status_code == 401


class TestLeaveList:
    """Tests for GET /leave"""

    def test_list_leave_success(self, client, faculty_auth_header):
        """Test listing leave requests."""
        response = client.get(BASE, headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_leave_admin(self, client, admin_auth_header):
        """Test listing leave requests as admin."""
        response = client.get(BASE, headers=admin_auth_header)
        assert response.status_code == 200


class TestLeaveGetById:
    """Tests for GET /leave/{requestId}"""

    def test_get_leave_success(self, client, faculty_auth_header):
        """Test getting a specific leave request."""
        response = client.get(f"{BASE}/1", headers=faculty_auth_header)
        assert response.status_code in (200, 404)

    def test_get_leave_not_found(self, client, faculty_auth_header):
        """Test getting non-existent leave request."""
        response = client.get(f"{BASE}/99999", headers=faculty_auth_header)
        assert response.status_code == 404


class TestLeaveReview:
    """Tests for PUT /leave/{requestId}/review"""

    def test_review_leave_success(self, client, admin_auth_header):
        """Test reviewing a leave request."""
        response = client.put(
            f"{BASE}/1/review",
            json={"status": "Approved", "adminComment": "Approved by admin"},
            headers=admin_auth_header,
        )
        assert response.status_code in (200, 404)

    def test_review_leave_not_found(self, client, admin_auth_header):
        """Test reviewing non-existent leave request."""
        response = client.put(
            f"{BASE}/99999/review",
            json={"status": "Rejected"},
            headers=admin_auth_header,
        )
        assert response.status_code == 404


class TestLeaveCancel:
    """Tests for PUT /leave/{requestId}/cancel"""

    def test_cancel_leave_success(self, client, faculty_auth_header):
        """Test cancelling a leave request."""
        response = client.put(f"{BASE}/1/cancel", headers=faculty_auth_header)
        assert response.status_code in (200, 404)

    def test_cancel_leave_not_found(self, client, faculty_auth_header):
        """Test cancelling non-existent leave request."""
        response = client.put(f"{BASE}/99999/cancel", headers=faculty_auth_header)
        assert response.status_code == 404


class TestLeaveStats:
    """Tests for GET /leave/stats"""

    def test_stats_success(self, client, faculty_auth_header):
        """Test getting leave statistics."""
        response = client.get(f"{BASE}/stats", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
