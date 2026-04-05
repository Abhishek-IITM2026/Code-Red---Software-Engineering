"""Test cases for Attendance API endpoints."""
import pytest

BASE = "/api/v1/attendance"


class TestAttendanceSubmit:
    """Tests for POST /attendance"""

    def test_submit_attendance_success(self, client, faculty_auth_header):
        """Test submitting attendance for a class."""
        response = client.post(
            BASE,
            json={
                "date": "2026-04-05",
                "class": "Class 9",
                "section": "A",
                "records": [
                    {"studentId": "1", "status": "present"},
                    {"studentId": "2", "status": "absent"},
                ],
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 201

    def test_submit_attendance_missing_date(self, client, faculty_auth_header):
        """Test submitting attendance without date."""
        response = client.post(
            BASE,
            json={
                "class": "Class 9",
                "records": [{"studentId": "1", "status": "present"}],
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 422

    def test_submit_attendance_empty_records(self, client, faculty_auth_header):
        """Test submitting attendance with empty records."""
        response = client.post(
            BASE,
            json={
                "date": "2026-04-05",
                "class": "Class 9",
                "records": [],
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 422

    def test_submit_attendance_forbidden_student(self, client, student_auth_header):
        """Test submitting attendance as student is forbidden."""
        response = client.post(
            BASE,
            json={
                "date": "2026-04-05",
                "class": "Class 9",
                "records": [{"studentId": "1", "status": "present"}],
            },
            headers=student_auth_header,
        )
        assert response.status_code == 403


class TestAttendanceUpdate:
    """Tests for PUT /attendance"""

    def test_update_attendance_success(self, client, faculty_auth_header):
        """Test updating attendance records."""
        response = client.put(
            BASE,
            json={
                "date": "2026-04-05",
                "class": "Class 9",
                "section": "A",
                "records": [
                    {"studentId": "1", "status": "late"},
                ],
            },
            headers=faculty_auth_header,
        )
        assert response.status_code == 200


class TestAttendanceList:
    """Tests for GET /attendance"""

    def test_list_attendance_success(self, client, faculty_auth_header):
        """Test listing attendance records."""
        response = client.get(BASE, headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_attendance_unauthenticated(self, client):
        """Test listing attendance without auth."""
        response = client.get(BASE)
        assert response.status_code == 401


class TestAttendanceMeStats:
    """Tests for GET /attendance/me/stats"""

    def test_stats_success(self, client, student_auth_header):
        """Test getting attendance stats for current student."""
        response = client.get(f"{BASE}/me/stats", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)

    def test_stats_unauthenticated(self, client):
        """Test getting stats without auth."""
        response = client.get(f"{BASE}/me/stats")
        assert response.status_code == 401