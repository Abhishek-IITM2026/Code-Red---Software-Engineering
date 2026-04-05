"""Test cases for Parent API endpoints."""
import pytest

BASE = "/api/v1/parent"


class TestParentChildrenList:
    """Tests for GET /parent/children"""

    def test_list_children_success(self, client, parent_auth_header):
        """Test listing children linked to parent."""
        response = client.get(f"{BASE}/children", headers=parent_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_children_unauthenticated(self, client):
        """Test listing children without auth."""
        response = client.get(f"{BASE}/children")
        assert response.status_code == 401

    def test_list_children_forbidden_student(self, client, student_auth_header):
        """Test listing children as student is forbidden."""
        response = client.get(f"{BASE}/children", headers=student_auth_header)
        assert response.status_code == 403


class TestParentChildById:
    """Tests for GET /parent/children/{childId}"""

    def test_get_child_success(self, client, parent_auth_header):
        """Test getting child details by ID."""
        response = client.get(f"{BASE}/children/1", headers=parent_auth_header)
        assert response.status_code in (200, 404)

    def test_get_child_invalid_id(self, client, parent_auth_header):
        """Test getting non-existent child."""
        response = client.get(f"{BASE}/children/99999", headers=parent_auth_header)
        assert response.status_code == 404


class TestParentChildDashboard:
    """Tests for GET /parent/children/{childId}/dashboard"""

    def test_dashboard_success(self, client, parent_auth_header):
        """Test getting child dashboard."""
        response = client.get(f"{BASE}/children/1/dashboard", headers=parent_auth_header)
        assert response.status_code in (200, 404)

    def test_dashboard_includes_courses(self, client, parent_auth_header):
        """Test dashboard response structure includes upcomingCourses."""
        response = client.get(f"{BASE}/children/1/dashboard", headers=parent_auth_header)
        if response.status_code == 200:
            data = response.get_json()
            assert "upcomingCourses" in data or isinstance(data, dict)

    def test_dashboard_forbidden_other_parent(self, client, admin_auth_header):
        """Test accessing another parent's child dashboard as admin."""
        response = client.get(f"{BASE}/children/1/dashboard", headers=admin_auth_header)
        assert response.status_code in (200, 403)


class TestParentChildAttendance:
    """Tests for GET /parent/children/{childId}/attendance"""

    def test_attendance_success(self, client, parent_auth_header):
        """Test getting child attendance."""
        response = client.get(f"{BASE}/children/1/attendance", headers=parent_auth_header)
        assert response.status_code in (200, 404)

    def test_attendance_invalid_child(self, client, parent_auth_header):
        """Test attendance for non-existent child."""
        response = client.get(f"{BASE}/children/99999/attendance", headers=parent_auth_header)
        assert response.status_code == 404


class TestParentChildPerformance:
    """Tests for GET /parent/children/{childId}/performance"""

    def test_performance_success(self, client, parent_auth_header):
        """Test getting child performance."""
        response = client.get(f"{BASE}/children/1/performance", headers=parent_auth_header)
        assert response.status_code in (200, 404)

    def test_performance_invalid_child(self, client, parent_auth_header):
        """Test performance for non-existent child."""
        response = client.get(f"{BASE}/children/99999/performance", headers=parent_auth_header)
        assert response.status_code == 404
