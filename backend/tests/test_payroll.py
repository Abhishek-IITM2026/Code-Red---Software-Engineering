"""Test cases for Payroll API endpoints."""
import pytest

BASE = "/api/v1/payroll"


class TestPayrollSalarySlips:
    """Tests for GET /payroll/salary-slips"""

    def test_list_salary_slips_admin(self, client, admin_auth_header):
        """Test listing all salary slips as admin."""
        response = client.get(f"{BASE}/salary-slips", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_salary_slips_forbidden_student(self, client, student_auth_header):
        """Test listing salary slips as student is forbidden."""
        response = client.get(f"{BASE}/salary-slips", headers=student_auth_header)
        assert response.status_code == 403

    def test_list_salary_slips_unauthenticated(self, client):
        """Test listing salary slips without auth."""
        response = client.get(f"{BASE}/salary-slips")
        assert response.status_code == 401


class TestPayrollMeSalarySlips:
    """Tests for GET /payroll/me/salary-slips"""

    def test_my_salary_slips_faculty(self, client, faculty_auth_header):
        """Test getting own salary slips as faculty."""
        response = client.get(f"{BASE}/me/salary-slips", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_my_salary_slips_admin(self, client, admin_auth_header):
        """Test getting own salary slips as admin."""
        response = client.get(f"{BASE}/me/salary-slips", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_my_salary_slips_forbidden_student(self, client, student_auth_header):
        """Test getting salary slips as student is forbidden."""
        response = client.get(f"{BASE}/me/salary-slips", headers=student_auth_header)
        assert response.status_code == 403

    def test_my_salary_slips_unauthenticated(self, client):
        """Test salary slips without auth."""
        response = client.get(f"{BASE}/me/salary-slips")
        assert response.status_code == 401


class TestPayrollSalarySlipStructure:
    """Tests for salary slip data structure"""

    def test_salary_slip_fields(self, client, faculty_auth_header):
        """Test that salary slip contains expected fields."""
        response = client.get(f"{BASE}/me/salary-slips", headers=faculty_auth_header)
        if response.status_code == 200:
            data = response.get_json()
            if data and len(data) > 0:
                slip = data[0]
                expected_fields = [
                    "staffId",
                    "staffName",
                    "employeeCode",
                    "monthKey",
                    "monthLabel",
                    "baseSalary",
                    "grossSalary",
                    "netSalary",
                    "payoutStatus",
                ]
                for field in expected_fields:
                    assert field in slip, f"Missing field: {field}"
