"""Test cases for Students API endpoints."""
import pytest

BASE = "/api/v1/students"


class TestStudentsList:
    """Tests for GET /students (admin only)"""

    def test_list_students_admin(self, client, admin_auth_header):
        """Test listing all students as admin."""
        response = client.get(BASE, headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_students_forbidden_student(self, client, student_auth_header):
        """Test listing students as student is forbidden."""
        response = client.get(BASE, headers=student_auth_header)
        assert response.status_code == 403


class TestStudentMe:
    """Tests for GET /students/me"""

    def test_me_success(self, client, student_auth_header):
        """Test getting current student profile."""
        response = client.get(f"{BASE}/me", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert "email" in data or "id" in data

    def test_me_unauthenticated(self, client):
        """Test me endpoint without auth."""
        response = client.get(f"{BASE}/me")
        assert response.status_code == 401


class TestStudentSubjects:
    """Tests for GET /students/me/subjects"""

    def test_subjects_success(self, client, student_auth_header):
        """Test getting student subjects."""
        response = client.get(f"{BASE}/me/subjects", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_subjects_unauthenticated(self, client):
        """Test subjects endpoint without auth."""
        response = client.get(f"{BASE}/me/subjects")
        assert response.status_code == 401


class TestStudentSubjectContent:
    """Tests for GET /students/me/subjects/{subjectId}/content"""

    def test_subject_content_success(self, client, student_auth_header):
        """Test getting subject content."""
        response = client.get(f"{BASE}/me/subjects/1/content", headers=student_auth_header)
        assert response.status_code in (200, 404)

    def test_subject_content_invalid_id(self, client, student_auth_header):
        """Test getting content for non-existent subject."""
        response = client.get(f"{BASE}/me/subjects/99999/content", headers=student_auth_header)
        assert response.status_code == 404


class TestStudentPerformance:
    """Tests for GET /students/me/performance"""

    def test_performance_success(self, client, student_auth_header):
        """Test getting student performance."""
        response = client.get(f"{BASE}/me/performance", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, (dict, list))

    def test_performance_unauthenticated(self, client):
        """Test performance endpoint without auth."""
        response = client.get(f"{BASE}/me/performance")
        assert response.status_code == 401


class TestStudentUpcomingCourses:
    """Tests for GET /students/me/upcoming-courses"""

    def test_upcoming_courses_success(self, client, student_auth_header):
        """Test getting upcoming courses for student."""
        response = client.get(f"{BASE}/me/upcoming-courses", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_upcoming_courses_unauthenticated(self, client):
        """Test upcoming courses without auth."""
        response = client.get(f"{BASE}/me/upcoming-courses")
        assert response.status_code == 401


class TestStudentById:
    """Tests for GET /students/{studentId}"""

    def test_get_student_admin(self, client, admin_auth_header):
        """Test getting student by ID as admin."""
        response = client.get(f"{BASE}/1", headers=admin_auth_header)
        assert response.status_code in (200, 404)

    def test_get_student_faculty(self, client, faculty_auth_header):
        """Test getting student by ID as faculty."""
        response = client.get(f"{BASE}/1", headers=faculty_auth_header)
        assert response.status_code in (200, 404)

    def test_get_student_forbidden(self, client, student_auth_header):
        """Test getting student by ID as student is forbidden."""
        response = client.get(f"{BASE}/1", headers=student_auth_header)
        assert response.status_code == 403
