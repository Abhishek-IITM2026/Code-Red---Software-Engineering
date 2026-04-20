"""Integration tests for Auth Blueprint API endpoints."""
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database


SEEDED_STUDENT_EMAIL = "student0001.aarav@example.in"
SEEDED_FACULTY_EMAIL = "faculty001.aarav@example.in"
SEEDED_ADMIN_EMAIL = "admin@example.in"
SEEDED_PARENT_EMAIL = "parent0001.aarav@example.in"


@pytest.fixture(scope="module")
def app():
    """Create application with seeded database."""
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
    """Create test client."""
    return app.test_client()


@pytest.fixture
def student_auth(client):
    """Get student authentication token."""
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_STUDENT_EMAIL,
        "password": "student123"
    })
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


@pytest.fixture
def admin_auth(client):
    """Get admin authentication token."""
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_ADMIN_EMAIL,
        "password": "admin123"
    })
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


class TestAuthLoginEndpoint:
    """Test POST /api/v1/auth/login"""

    def test_login_success_student(self, client):
        """Test successful student login."""
        response = client.post("/api/v1/auth/login", json={
            "email": SEEDED_STUDENT_EMAIL,
            "password": "student123"
        })
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == SEEDED_STUDENT_EMAIL

    def test_login_success_admin(self, client):
        """Test successful admin login."""
        response = client.post("/api/v1/auth/login", json={
            "email": SEEDED_ADMIN_EMAIL,
            "password": "admin123"
        })
        assert response.status_code == 200
        assert "token" in response.get_json()

    def test_login_invalid_email(self, client):
        """Test login with non-existent email."""
        response = client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        assert response.status_code == 401

    def test_login_wrong_password(self, client):
        """Test login with wrong password."""
        response = client.post("/api/v1/auth/login", json={
            "email": SEEDED_STUDENT_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_login_missing_email(self, client):
        """Test login with missing email."""
        response = client.post("/api/v1/auth/login", json={
            "password": "student123"
        })
        assert response.status_code == 422

    def test_login_missing_password(self, client):
        """Test login with missing password."""
        response = client.post("/api/v1/auth/login", json={
            "email": SEEDED_STUDENT_EMAIL
        })
        assert response.status_code == 422


class TestAuthMeEndpoint:
    """Test GET /api/v1/auth/me"""

    def test_me_authenticated(self, client, student_auth):
        """Test getting current user info when authenticated."""
        response = client.get("/api/v1/auth/me", headers=student_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "email" in data

    def test_me_unauthenticated(self, client):
        """Test getting current user info without authentication."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

    def test_me_invalid_token(self, client):
        """Test with invalid token."""
        response = client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer invalid_token"
        })
        assert response.status_code == 401


class TestAuthLogoutEndpoint:
    """Test POST /api/v1/auth/logout"""

    def test_logout_success(self, client, student_auth):
        """Test successful logout."""
        response = client.post("/api/v1/auth/logout", headers=student_auth)
        assert response.status_code == 200

    def test_logout_unauthenticated(self, client):
        """Test logout without authentication."""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 401


class TestAuthRefreshEndpoint:
    """Test POST /api/v1/auth/refresh"""

    def test_refresh_token(self, client, student_auth):
        """Test token refresh."""
        response = client.post("/api/v1/auth/refresh", headers=student_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data