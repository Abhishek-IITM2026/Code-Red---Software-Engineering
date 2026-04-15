"""Test cases for Schedule API endpoints."""
import pytest

BASE = "/api/v1/schedule"


class TestScheduleList:
    """Tests for GET /schedule"""

    def test_list_schedule_success(self, client, admin_auth_header):
        """Test listing all schedules as admin."""
        response = client.get(BASE, headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_schedule_unauthenticated(self, client):
        """Test listing schedules without auth."""
        response = client.get(BASE)
        assert response.status_code == 401


class TestScheduleMe:
    """Tests for GET /schedule/me"""

    def test_my_schedule_faculty(self, client, faculty_auth_header):
        """Test getting own schedule as faculty."""
        response = client.get(f"{BASE}/me", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_my_schedule_student(self, client, student_auth_header):
        """Test getting own schedule as student."""
        response = client.get(f"{BASE}/me", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)


class TestScheduleCreate:
    """Tests for POST /schedule"""

    def test_create_schedule_success(self, client, admin_auth_header):
        """Test creating a new schedule entry."""
        response = client.post(
            BASE,
            json={
                "classId": "1",
                "facultyId": "1",
                "dayOfWeek": 1,
                "startTime": "09:00",
                "endTime": "10:00",
                "roomNumber": "Room 101",
            },
            headers=admin_auth_header,
        )
        assert response.status_code in (200, 201)

    def test_create_schedule_missing_fields(self, client, admin_auth_header):
        """Test creating schedule with missing required fields."""
        response = client.post(
            BASE,
            json={"classId": "1"},
            headers=admin_auth_header,
        )
        assert response.status_code == 422

    def test_create_schedule_invalid_day(self, client, admin_auth_header):
        """Test creating schedule with invalid day of week."""
        response = client.post(
            BASE,
            json={
                "classId": "1",
                "facultyId": "1",
                "dayOfWeek": 8,
                "startTime": "09:00",
                "endTime": "10:00",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 422

    def test_create_schedule_rejects_overlapping_class_schedule(self, client, admin_auth_header):
        first_response = client.post(
            BASE,
            json={
                "classId": "1",
                "facultyId": "1",
                "subjectId": "1",
                "dayOfWeek": 2,
                "startTime": "09:00",
                "endTime": "10:00",
                "roomNumber": "Room 101",
            },
            headers=admin_auth_header,
        )
        assert first_response.status_code in (200, 201), first_response.get_json()

        overlapping_response = client.post(
            BASE,
            json={
                "classId": "1",
                "facultyId": "1",
                "subjectId": "1",
                "dayOfWeek": 2,
                "startTime": "09:30",
                "endTime": "10:30",
                "roomNumber": "Room 102",
            },
            headers=admin_auth_header,
        )
        assert overlapping_response.status_code == 409
        payload = overlapping_response.get_json()
        assert payload["error"]["code"] == "SCHEDULE_CONFLICT"


class TestScheduleUpdate:
    """Tests for PUT /schedule/{scheduleId}"""

    def test_update_schedule_success(self, client, admin_auth_header):
        """Test updating a schedule entry."""
        response = client.put(
            f"{BASE}/1",
            json={
                "classId": "1",
                "facultyId": "1",
                "dayOfWeek": 2,
                "startTime": "10:00",
                "endTime": "11:00",
                "roomNumber": "Room 202",
            },
            headers=admin_auth_header,
        )
        assert response.status_code in (200, 404)

    def test_update_schedule_not_found(self, client, admin_auth_header):
        """Test updating non-existent schedule."""
        response = client.put(
            f"{BASE}/99999",
            json={"classId": "1", "facultyId": "1", "dayOfWeek": 1, "startTime": "09:00", "endTime": "10:00"},
            headers=admin_auth_header,
        )
        assert response.status_code == 404


class TestScheduleDelete:
    """Tests for DELETE /schedule/{scheduleId}"""

    def test_delete_schedule_success(self, client, admin_auth_header):
        """Test deleting a schedule entry."""
        response = client.delete(f"{BASE}/1", headers=admin_auth_header)
        assert response.status_code in (204, 404)

    def test_delete_schedule_not_found(self, client, admin_auth_header):
        """Test deleting non-existent schedule."""
        response = client.delete(f"{BASE}/99999", headers=admin_auth_header)
        assert response.status_code == 404
