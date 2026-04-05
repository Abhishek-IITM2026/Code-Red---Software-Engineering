"""Test cases for Faculty API endpoints."""
import pytest

BASE = "/api/v1/faculty"


class TestFacultyList:
    """Tests for GET /faculty"""

    def test_list_faculty_admin(self, client, admin_auth_header):
        """Test listing all faculty as admin."""
        response = client.get(BASE, headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_faculty_forbidden(self, client, student_auth_header):
        """Test listing faculty as student is forbidden."""
        response = client.get(BASE, headers=student_auth_header)
        assert response.status_code == 403


class TestFacultyClasses:
    """Tests for GET /faculty/classes"""

    def test_classes_success(self, client, faculty_auth_header):
        """Test getting faculty assigned classes."""
        response = client.get(f"{BASE}/classes", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_classes_forbidden(self, client, student_auth_header):
        """Test getting classes as student is forbidden."""
        response = client.get(f"{BASE}/classes", headers=student_auth_header)
        assert response.status_code == 403


class TestFacultyClassesOverview:
    """Tests for GET /faculty/classes/overview"""

    def test_overview_success(self, client, faculty_auth_header):
        """Test getting classes overview."""
        response = client.get(f"{BASE}/classes/overview", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)


class TestFacultyClassSubjects:
    """Tests for GET /faculty/classes/{classId}/subjects"""

    def test_subjects_success(self, client, faculty_auth_header):
        """Test getting subjects for a class."""
        response = client.get(f"{BASE}/classes/1/subjects", headers=faculty_auth_header)
        assert response.status_code in (200, 404)

    def test_subjects_invalid_class(self, client, faculty_auth_header):
        """Test subjects for non-existent class."""
        response = client.get(f"{BASE}/classes/99999/subjects", headers=faculty_auth_header)
        assert response.status_code == 404


class TestFacultyPerformanceStudents:
    """Tests for GET /faculty/performance/students"""

    def test_performance_students_success(self, client, faculty_auth_header):
        """Test getting student performance."""
        response = client.get(f"{BASE}/performance/students", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_performance_students_with_class(self, client, faculty_auth_header):
        """Test getting performance filtered by class."""
        response = client.get(f"{BASE}/performance/students?classId=1", headers=faculty_auth_header)
        assert response.status_code == 200


class TestFacultySchedule:
    """Tests for GET /faculty/schedule"""

    def test_schedule_success(self, client, faculty_auth_header):
        """Test getting faculty schedule."""
        response = client.get(f"{BASE}/schedule", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)


class TestFacultyMaterials:
    """Tests for GET/POST /faculty/subjects/{subjectId}/materials"""

    def test_list_materials_success(self, client, faculty_auth_header):
        """Test listing materials for a subject."""
        response = client.get(f"{BASE}/subjects/1/materials", headers=faculty_auth_header)
        assert response.status_code in (200, 404)

    def test_publish_material_success(self, client, faculty_auth_header):
        """Test publishing a material."""
        response = client.post(
            f"{BASE}/subjects/1/materials",
            json={"title": "Test Material", "type": "notes", "description": "Test desc"},
            headers=faculty_auth_header,
        )
        assert response.status_code in (201, 404)

    def test_publish_material_invalid_subject(self, client, faculty_auth_header):
        """Test publishing material for non-existent subject."""
        response = client.post(
            f"{BASE}/subjects/99999/materials",
            json={"title": "Test Material", "type": "notes", "description": "Test desc"},
            headers=faculty_auth_header,
        )
        assert response.status_code == 404

    def test_publish_material_missing_title(self, client, faculty_auth_header):
        """Test publishing material without title."""
        response = client.post(
            f"{BASE}/subjects/1/materials",
            json={"type": "notes"},
            headers=faculty_auth_header,
        )
        assert response.status_code == 422


class TestFacultyUpcomingCourses:
    """Tests for GET /faculty/upcoming-courses"""

    def test_upcoming_courses_success(self, client, faculty_auth_header):
        """Test getting upcoming courses for faculty."""
        response = client.get(f"{BASE}/upcoming-courses", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_upcoming_courses_admin(self, client, admin_auth_header):
        """Test getting upcoming courses as admin."""
        response = client.get(f"{BASE}/upcoming-courses", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_upcoming_courses_forbidden(self, client, student_auth_header):
        """Test getting upcoming courses as student is forbidden."""
        response = client.get(f"{BASE}/upcoming-courses", headers=student_auth_header)
        assert response.status_code == 403

    def test_upcoming_courses_unauthenticated(self, client):
        """Test upcoming courses without auth."""
        response = client.get(f"{BASE}/upcoming-courses")
        assert response.status_code == 401
