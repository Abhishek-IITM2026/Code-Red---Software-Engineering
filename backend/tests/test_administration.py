"""Test cases for Administration API endpoints."""
import pytest

BASE = "/api/v1/administration"


class TestAdminDashboard:
    """Tests for GET /administration/dashboard"""

    def test_dashboard_success(self, client, admin_auth_header):
        """Test getting admin dashboard."""
        response = client.get(f"{BASE}/dashboard", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)

    def test_dashboard_forbidden_student(self, client, student_auth_header):
        """Test dashboard access as student is forbidden."""
        response = client.get(f"{BASE}/dashboard", headers=student_auth_header)
        assert response.status_code == 403

    def test_dashboard_unauthenticated(self, client):
        """Test dashboard without auth."""
        response = client.get(f"{BASE}/dashboard")
        assert response.status_code == 401


class TestAdminStudents:
    """Tests for student management endpoints"""

    def test_list_students(self, client, admin_auth_header):
        """Test listing all students."""
        response = client.get(f"{BASE}/students", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_get_student(self, client, admin_auth_header, seeded_student):
        """Test getting a single student."""
        response = client.get(f"{BASE}/students/{seeded_student.id}", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert data["id"] == str(seeded_student.id)

    def test_create_student(self, client, admin_auth_header):
        """Test creating a new student."""
        response = client.post(
            f"{BASE}/students",
            json={
                "email": "newstudent@test.com",
                "firstName": "New",
                "lastName": "Student",
                "class": "Class 9",
                "section": "A",
                "enrollmentNo": "TEST-001",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["email"] == "newstudent@test.com"

    def test_create_student_duplicate_email(self, client, admin_auth_header):
        """Test creating student with existing email."""
        client.post(
            f"{BASE}/students",
            json={
                "email": "dupstudent@test.com",
                "firstName": "First",
                "lastName": "Student",
                "class": "Class 9",
                "section": "A",
                "enrollmentNo": "TEST-DUP-1",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        response = client.post(
            f"{BASE}/students",
            json={
                "email": "dupstudent@test.com",
                "firstName": "Second",
                "lastName": "Student",
                "class": "Class 9",
                "section": "A",
                "enrollmentNo": "TEST-DUP-2",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 409

    def test_create_student_missing_fields(self, client, admin_auth_header):
        """Test creating student with missing required fields."""
        response = client.post(
            f"{BASE}/students",
            json={"email": "incomplete@test.com"},
            headers=admin_auth_header,
        )
        assert response.status_code == 422

    def test_update_student(self, client, admin_auth_header, seeded_student):
        """Test updating a student."""
        response = client.put(
            f"{BASE}/students/{seeded_student.id}",
            json={
                "email": "updated@test.com",
                "firstName": "Updated",
                "lastName": "Student",
                "class": "Class 9",
                "section": "A",
                "enrollmentNo": "TEST-UPD-1",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 200

    def test_update_student_status(self, client, admin_auth_header, seeded_student):
        """Test updating student status."""
        response = client.patch(
            f"{BASE}/students/{seeded_student.id}/status",
            json={"status": "inactive"},
            headers=admin_auth_header,
        )
        assert response.status_code == 200
        assert response.get_json()["status"] == "inactive"

    def test_delete_student(self, client, admin_auth_header, seeded_student):
        """Test deleting a student."""
        response = client.delete(f"{BASE}/students/{seeded_student.id}", headers=admin_auth_header)
        assert response.status_code == 200
        assert response.get_json()["success"] is True


class TestAdminStaff:
    """Tests for staff management endpoints"""

    def test_list_staff(self, client, admin_auth_header):
        """Test listing all staff."""
        response = client.get(f"{BASE}/staff", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_get_staff(self, client, admin_auth_header, seeded_staff_user_id):
        """Test getting a single staff member."""
        response = client.get(f"{BASE}/staff/{seeded_staff_user_id}", headers=admin_auth_header)
        assert response.status_code == 200
        assert response.get_json()["id"] == str(seeded_staff_user_id)

    def test_create_staff_teaching(self, client, admin_auth_header):
        """Test creating a teaching staff member."""
        response = client.post(
            f"{BASE}/staff",
            json={
                "email": "newteacher@test.com",
                "firstName": "New",
                "lastName": "Teacher",
                "employeeCode": "EMP-TEST-001",
                "category": "Teaching",
                "designation": "Mathematics Teacher",
                "department": "Mathematics",
                "joiningDate": "2024-01-15",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 201

    def test_create_staff_non_teaching(self, client, admin_auth_header):
        """Test creating a non-teaching staff member."""
        response = client.post(
            f"{BASE}/staff",
            json={
                "email": "newnonteacher@test.com",
                "firstName": "New",
                "lastName": "NonTeacher",
                "employeeCode": "EMP-TEST-002",
                "category": "Non-Teaching",
                "designation": "Accountant",
                "department": "Finance",
                "joiningDate": "2024-02-01",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 201

    def test_create_staff_duplicate_employee_code(self, client, admin_auth_header):
        """Test creating staff with existing employee code."""
        client.post(
            f"{BASE}/staff",
            json={
                "email": "staff1@test.com",
                "firstName": "Staff",
                "lastName": "One",
                "employeeCode": "EMP-DUP-001",
                "category": "Teaching",
                "designation": "Science Teacher",
                "department": "Science",
                "joiningDate": "2024-01-01",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        response = client.post(
            f"{BASE}/staff",
            json={
                "email": "staff2@test.com",
                "firstName": "Staff",
                "lastName": "Two",
                "employeeCode": "EMP-DUP-001",
                "category": "Teaching",
                "designation": "English Teacher",
                "department": "English",
                "joiningDate": "2024-01-02",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 409

    def test_create_staff_missing_fields(self, client, admin_auth_header):
        """Test creating staff with missing required fields."""
        response = client.post(
            f"{BASE}/staff",
            json={"email": "incomplete@test.com"},
            headers=admin_auth_header,
        )
        assert response.status_code == 422

    def test_update_staff(self, client, admin_auth_header, seeded_staff_user_id):
        """Test updating a staff member."""
        response = client.put(
            f"{BASE}/staff/{seeded_staff_user_id}",
            json={
                "email": "staffupdate@test.com",
                "firstName": "Updated",
                "lastName": "Staff",
                "employeeCode": "EMP-UPD-001",
                "category": "Teaching",
                "designation": "Physics Teacher",
                "department": "Physics",
                "joiningDate": "2023-06-15",
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 200

    def test_update_staff_status(self, client, admin_auth_header, seeded_staff_user_id):
        """Test updating staff status."""
        response = client.patch(
            f"{BASE}/staff/{seeded_staff_user_id}/status",
            json={"status": "inactive"},
            headers=admin_auth_header,
        )
        assert response.status_code == 200
        assert response.get_json()["status"] == "inactive"

    def test_delete_staff(self, client, admin_auth_header, seeded_staff_user_id):
        """Test deleting a staff member."""
        response = client.delete(f"{BASE}/staff/{seeded_staff_user_id}", headers=admin_auth_header)
        assert response.status_code == 200
        assert response.get_json()["success"] is True


class TestAdminCourses:
    """Tests for course management endpoints"""

    def test_list_courses(self, client, admin_auth_header):
        """Test listing all courses."""
        response = client.get(f"{BASE}/courses", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_create_course(self, client, admin_auth_header):
        """Test creating a new course."""
        response = client.post(
            f"{BASE}/courses",
            json={
                "title": "Advanced Mathematics",
                "description": "Advanced course for Class 10",
                "className": "Class 10",
                "section": "A",
                "startDate": "2026-04-01",
                "endDate": "2026-06-30",
                "instructor": "Mrs. Ananya Menon",
                "mode": "Offline",
                "seats": 30,
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["title"] == "Advanced Mathematics"

    def test_create_course_invalid_dates(self, client, admin_auth_header):
        """Test creating course with end date before start date."""
        response = client.post(
            f"{BASE}/courses",
            json={
                "title": "Invalid Course",
                "description": "Test",
                "className": "Class 9",
                "section": "A",
                "startDate": "2026-06-30",
                "endDate": "2026-04-01",
                "instructor": "Test Teacher",
                "mode": "Online",
                "seats": 20,
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 422

    def test_create_course_invalid_seats(self, client, admin_auth_header):
        """Test creating course with invalid seats."""
        response = client.post(
            f"{BASE}/courses",
            json={
                "title": "Course Zero Seats",
                "description": "Test",
                "className": "Class 9",
                "section": "A",
                "startDate": "2026-04-01",
                "endDate": "2026-06-30",
                "instructor": "Test Teacher",
                "mode": "Online",
                "seats": 0,
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 422

    def test_update_course(self, client, admin_auth_header):
        """Test updating a course."""
        response = client.put(
            f"{BASE}/courses/1",
            json={
                "title": "Updated Course",
                "description": "Updated description",
                "className": "Class 9",
                "section": "A",
                "startDate": "2026-04-01",
                "endDate": "2026-06-30",
                "instructor": "Test Teacher",
                "mode": "Hybrid",
                "seats": 25,
                "status": "active",
            },
            headers=admin_auth_header,
        )
        assert response.status_code in (200, 404)

    def test_delete_course(self, client, admin_auth_header):
        """Test deleting a course."""
        response = client.delete(f"{BASE}/courses/1", headers=admin_auth_header)
        assert response.status_code in (200, 404)


class TestAdminPromotions:
    """Tests for student promotion endpoints"""

    def test_list_promotion_candidates(self, client, admin_auth_header):
        """Test listing promotion candidates."""
        response = client.get(f"{BASE}/promotions/candidates", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_promote_single_student(self, client, admin_auth_header, seeded_student):
        """Test promoting a single student."""
        response = client.post(
            f"{BASE}/promotions/{seeded_student.id}",
            json={"targetClass": "Class 10"},
            headers=admin_auth_header,
        )
        assert response.status_code in (200, 409)

    def test_promote_student_already_enrolled(self, client, admin_auth_header, seeded_student):
        """Test promoting student already in target class."""
        enrollment = seeded_student.current_enrollment()
        assert enrollment is not None
        response = client.post(
            f"{BASE}/promotions/{seeded_student.id}",
            json={"targetClass": enrollment.institute_class.name},
            headers=admin_auth_header,
        )
        assert response.status_code == 409

    def test_promote_students_bulk(self, client, admin_auth_header):
        """Test bulk student promotion."""
        response = client.post(
            f"{BASE}/students/promote",
            json={
                "studentIds": ["1"],
                "promoteToClass": "Class 10",
                "promoteToSection": "A",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 200

    def test_promote_bulk_missing_fields(self, client, admin_auth_header):
        """Test bulk promotion with missing fields."""
        response = client.post(
            f"{BASE}/students/promote",
            json={"studentIds": ["1"]},
            headers=admin_auth_header,
        )
        assert response.status_code == 400


class TestAdminFinancialRecords:
    """Tests for staff financial record endpoints"""

    def test_list_financial_records(self, client, admin_auth_header):
        """Test listing all financial records."""
        response = client.get(f"{BASE}/financial-records", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_get_financial_record(self, client, admin_auth_header, seeded_staff_user_id):
        """Test getting a single financial record."""
        response = client.get(f"{BASE}/financial-records/{seeded_staff_user_id}", headers=admin_auth_header)
        assert response.status_code == 200
        assert response.get_json()["staffId"] == str(seeded_staff_user_id)

    def test_create_financial_record(self, client, admin_auth_header, seeded_staff_user_id):
        """Test creating a financial record."""
        response = client.post(
            f"{BASE}/financial-records",
            json={
                "staffId": str(seeded_staff_user_id),
                "basePay": "Rs. 30000",
                "currentSalary": "Rs. 45000",
                "lastIncrement": "Rs. 5000",
                "nextReview": "2026-06-30",
                "bankAccount": "XXXXXX1234",
                "earningsBreakdown": [
                    {"label": "Basic Pay", "amount": "Rs. 30000"},
                    {"label": "Allowances", "amount": "Rs. 15000"},
                ],
            },
            headers=admin_auth_header,
        )
        assert response.status_code in (201, 409)

    def test_create_financial_record_invalid_salary(self, client, admin_auth_header, seeded_staff_user_id):
        """Test updating financial record with invalid salary format."""
        response = client.put(
            f"{BASE}/financial-records/{seeded_staff_user_id}",
            json={
                "basePay": "not_a_number",
                "currentSalary": "Rs. 45000",
                "lastIncrement": "Rs. 5000",
                "nextReview": "2026-06-30",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 422

    def test_update_financial_record(self, client, admin_auth_header, seeded_staff_user_id):
        """Test updating a financial record."""
        response = client.put(
            f"{BASE}/financial-records/{seeded_staff_user_id}",
            json={
                "basePay": "Rs. 35000",
                "currentSalary": "Rs. 50000",
                "lastIncrement": "Rs. 10000",
                "nextReview": "2026-07-31",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 200


class TestAdminReports:
    """Tests for report generation endpoints"""

    def test_attendance_reports(self, client, admin_auth_header):
        """Test getting attendance reports."""
        response = client.get(f"{BASE}/reports/attendance", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_exam_participation_reports(self, client, admin_auth_header):
        """Test getting exam participation reports."""
        response = client.get(f"{BASE}/reports/exam-participation", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_generate_report(self, client, admin_auth_header):
        """Test generating a report."""
        response = client.post(
            f"{BASE}/reports/generate",
            json={"reportType": "attendance"},
            headers=admin_auth_header,
        )
        assert response.status_code == 200
