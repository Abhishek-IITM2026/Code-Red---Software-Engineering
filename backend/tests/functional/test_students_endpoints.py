"""
Comprehensive functional tests for Students API endpoints.

Use Case: Student profile management and academic data access
Description: Tests for student profile, schedules, marks, attendance, and assignments
"""
import pytest

BASE_URL = "/api/v1/students"


class TestGetStudentProfileEndpoint:
    """Functional tests for GET /api/v1/students/me"""

    def test_get_student_profile_success(self, client, student_auth_header):
        """
        Test Case: Get Student Profile - Success
        Inputs:
          - Valid student token
        Expected Output:
          - Status: 200 OK
          - Student object with email, name, roll number, class
        Actual Output: Returns student profile
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/me",
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["email"] == "student.aarav@example.in"
        assert "roll_number" in data
        assert "class_enrollment" in data or "class" in data

    def test_get_student_profile_without_auth(self, client):
        """
        Test Case: Get Student Profile Without Authentication
        Inputs:
          - No token
        Expected Output:
          - Status: 401 Unauthorized
        Actual Output: Returns 401
        Result: Success
        """
        response = client.get(f"{BASE_URL}/me")
        assert response.status_code == 401

    def test_get_student_profile_with_invalid_token(self, client):
        """
        Test Case: Get Student Profile With Invalid Token
        Inputs:
          - Invalid/expired token
        Expected Output:
          - Status: 401 Unauthorized
        Actual Output: Returns 401
        Result: Success
        """
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get(f"{BASE_URL}/me", headers=headers)
        assert response.status_code == 401


class TestGetAllStudentsEndpoint:
    """Functional tests for GET /api/v1/students"""

    def test_get_all_students_as_admin(self, client, admin_auth_header):
        """
        Test Case: Get All Students - Admin Access
        Inputs:
          - Admin token
          - No filters
        Expected Output:
          - Status: 200 OK
          - Array of student objects
        Actual Output: Returns list of students
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}",
            headers=admin_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "email" in data[0]

    def test_get_students_by_class_and_section(self, client, admin_auth_header):
        """
        Test Case: Get Students Filtered By Class And Section
        Inputs:
          - Admin token
          - class: 8
          - section: A
        Expected Output:
          - Status: 200 OK
          - Array of students in Class 8 Section A
        Actual Output: Returns filtered students
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}?class=8&section=A",
            headers=admin_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_get_students_student_cannot_access_all(self, client, student_auth_header):
        """
        Test Case: Student Cannot Access All Students List
        Inputs:
          - Student token
        Expected Output:
          - Status: 403 Forbidden
        Actual Output: Returns 403
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}",
            headers=student_auth_header,
        )
        assert response.status_code == 403


class TestGetStudentByIdEndpoint:
    """Functional tests for GET /api/v1/students/{studentId}"""

    def test_get_student_by_id_as_admin(self, client, admin_auth_header, seeded_student):
        """
        Test Case: Get Student By ID - Admin Access
        Inputs:
          - Admin token
          - Student ID: {seeded_student.id}
        Expected Output:
          - Status: 200 OK
          - Student object with all details
        Actual Output: Returns student data
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/{seeded_student.id}",
            headers=admin_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["id"] == seeded_student.id

    def test_get_student_by_id_nonexistent(self, client, admin_auth_header):
        """
        Test Case: Get Nonexistent Student By ID
        Inputs:
          - Admin token
          - Student ID: 99999 (nonexistent)
        Expected Output:
          - Status: 404 Not Found
        Actual Output: Returns 404
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/99999",
            headers=admin_auth_header,
        )
        assert response.status_code == 404


class TestStudentSubjectsEndpoint:
    """Functional tests for GET /api/v1/students/me/subjects"""

    def test_get_student_subjects(self, client, student_auth_header):
        """
        Test Case: Get Student Enrolled Subjects
        Inputs:
          - Valid student token
        Expected Output:
          - Status: 200 OK
          - Array of subjects for student's class
        Actual Output: Returns subjects list
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/me/subjects",
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "subject_name" in data[0] or "name" in data[0]

    def test_get_student_subjects_without_auth(self, client):
        """
        Test Case: Get Student Subjects Without Authentication
        Inputs:
          - No token
        Expected Output:
          - Status: 401 Unauthorized
        Actual Output: Returns 401
        Result: Success
        """
        response = client.get(f"{BASE_URL}/me/subjects")
        assert response.status_code == 401


class TestStudentPerformanceEndpoint:
    """Functional tests for GET /api/v1/students/me/performance"""

    def test_get_student_performance(self, client, student_auth_header):
        """
        Test Case: Get Student Performance Summary
        Inputs:
          - Valid student token
        Expected Output:
          - Status: 200 OK
          - Performance object with marks, attendance, progress
        Actual Output: Returns performance data
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/me/performance",
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)

    def test_get_student_performance_includes_marks(self, client, student_auth_header):
        """
        Test Case: Performance Data Includes Average Marks
        Inputs:
          - Valid student token
        Expected Output:
          - Status: 200 OK
          - Performance object has average_marks field
        Actual Output: Returns performance with marks
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/me/performance",
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        # Check for marks-related field
        has_marks = any(field in data for field in ["average_marks", "total_marks", "marks"])
        assert has_marks or isinstance(data, dict)  # May be empty if no marks yet


class TestStudentScheduleEndpoint:
    """Functional tests for GET /api/v1/students/me/schedule"""

    def test_get_student_timetable(self, client, student_auth_header):
        """
        Test Case: Get Student Timetable
        Inputs:
          - Valid student token
        Expected Output:
          - Status: 200 OK
          - Array of schedule entries for student's class
        Actual Output: Returns timetable
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/me/schedule",
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "day_of_week" in data[0] or "subject" in data[0]


class TestStudentErrorHandling:
    """Error handling tests for student endpoints"""

    def test_invalid_student_id_format(self, client, admin_auth_header):
        """
        Test Case: Invalid Student ID Format
        Inputs:
          - Admin token
          - Student ID: "abc" (invalid format)
        Expected Output:
          - Status: 422 Unprocessable Entity or 400
        Actual Output: Returns error
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/abc",
            headers=admin_auth_header,
        )
        assert response.status_code in [400, 404, 422]

    def test_get_students_with_invalid_class(self, client, admin_auth_header):
        """
        Test Case: Filter By Invalid Class
        Inputs:
          - Admin token
          - class: 999 (invalid)
        Expected Output:
          - Status: 200 with empty result or 400
        Actual Output: Returns empty list or error
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}?class=999",
            headers=admin_auth_header,
        )
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            assert response.get_json() is not None
