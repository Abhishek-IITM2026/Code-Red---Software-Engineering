"""Integration tests for Payroll Blueprint API endpoints."""
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database


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


class TestListSalarySlipsEndpoint:
    """Test GET /api/v1/payroll/salary-slips"""

    def test_list_salary_slips_as_admin(self, client, admin_auth):
        """Test admin can list salary slips."""
        response = client.get("/api/v1/payroll/salary-slips", headers=admin_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data
        assert isinstance(data["data"], list)

    def test_list_salary_slips_as_faculty(self, client, faculty_auth):
        """Test faculty can list salary slips."""
        response = client.get("/api/v1/payroll/salary-slips", headers=faculty_auth)
        assert response.status_code == 200

    def test_list_salary_slips_unauthenticated(self, client):
        """Test listing slips without auth fails."""
        response = client.get("/api/v1/payroll/salary-slips")
        assert response.status_code == 401

    def test_list_salary_slips_with_year_filter(self, client, admin_auth):
        """Test listing slips with year filter."""
        response = client.get("/api/v1/payroll/salary-slips?year=2024", headers=admin_auth)
        assert response.status_code == 200


class TestMySalarySlipsEndpoint:
    """Test GET /api/v1/payroll/me/salary-slips"""

    def test_list_my_salary_slips(self, client, faculty_auth):
        """Test faculty can list own salary slips."""
        response = client.get("/api/v1/payroll/me/salary-slips", headers=faculty_auth)
        assert response.status_code == 200

    def test_my_salary_slips_unauthenticated(self, client):
        """Test without auth fails."""
        response = client.get("/api/v1/payroll/me/salary-slips")
        assert response.status_code == 401


class TestSalaryAccountEndpoint:
    """Test /api/v1/payroll/me/account-details"""

    def test_get_my_account_details(self, client, faculty_auth):
        """Test getting own salary account details."""
        response = client.get("/api/v1/payroll/me/account-details", headers=faculty_auth)
        assert response.status_code == 200

    def test_save_my_account_details(self, client, admin_auth):
        """Test saving salary account details."""
        response = client.put("/api/v1/payroll/me/account-details", headers=admin_auth, json={
            "accountHolderName": "Admin User",
            "bankName": "State Bank",
            "accountNumber": "1234567890",
            "ifscCode": "SBIN0001234",
            "branchName": "Main Branch",
            "accountType": "Savings"
        })
        assert response.status_code == 200


class TestAccountChangeRequestsEndpoint:
    """Test /api/v1/payroll/me/account-change-requests"""

    def test_list_my_account_change_requests(self, client, admin_auth):
        """Test listing account change requests."""
        response = client.get("/api/v1/payroll/me/account-change-requests", headers=admin_auth)
        assert response.status_code == 200

    def test_create_account_change_request(self, client, admin_auth):
        """Test creating account change request."""
        response = client.post("/api/v1/payroll/me/account-change-requests", headers=admin_auth, json={
            "requestedData": {
                "bankName": "New Bank",
                "accountNumber": "9876543210"
            }
        })
        assert response.status_code == 201