"""Test cases for Auth API endpoints."""
import pytest

BASE = "/api/v1/auth"
SEEDED_STUDENT_EMAIL = "student001@example.com"
SEEDED_FACULTY_EMAIL = "faculty01@example.com"
SEEDED_ADMIN_EMAIL = "dheerajkumarvishwakarma5@gmail.com"
SEEDED_PARENT_EMAIL = "parent001@example.com"


class TestAuthLogin:
    """Tests for POST /auth/login"""

    def test_login_success_student(self, client):
        """Test successful login with student credentials."""
        response = client.post(
            f"{BASE}/login",
            json={"email": SEEDED_STUDENT_EMAIL, "password": "student123"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert data["user"]["email"] == SEEDED_STUDENT_EMAIL
        assert data["user"]["role"] == "student"

    def test_login_success_faculty(self, client):
        """Test successful login with faculty credentials."""
        response = client.post(
            f"{BASE}/login",
            json={"email": SEEDED_FACULTY_EMAIL, "password": "faculty123"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert data["user"]["email"] == SEEDED_FACULTY_EMAIL

    def test_login_success_admin(self, client):
        """Test successful login with admin credentials."""
        response = client.post(
            f"{BASE}/login",
            json={"email": SEEDED_ADMIN_EMAIL, "password": "admin123"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data

    def test_login_success_parent(self, client):
        """Test successful login with parent credentials."""
        response = client.post(
            f"{BASE}/login",
            json={"email": SEEDED_PARENT_EMAIL, "password": "parent123"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data

    def test_login_invalid_email(self, client):
        """Test login with non-existent email."""
        response = client.post(
            f"{BASE}/login",
            json={"email": "nobody@example.com", "password": "wrong123"},
        )
        assert response.status_code == 401
        data = response.get_json()
        assert "error" in data or "message" in data

    def test_login_wrong_password(self, client):
        """Test login with wrong password."""
        response = client.post(
            f"{BASE}/login",
            json={"email": SEEDED_STUDENT_EMAIL, "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_login_missing_email(self, client):
        """Test login with missing email field."""
        response = client.post(f"{BASE}/login", json={"password": "student123"})
        assert response.status_code == 422

    def test_login_missing_password(self, client):
        """Test login with missing password field."""
        response = client.post(f"{BASE}/login", json={"email": SEEDED_STUDENT_EMAIL})
        assert response.status_code == 422


class TestAuthRegister:
    """Tests for POST /auth/register"""

    def test_register_success(self, client):
        """Test successful user registration."""
        response = client.post(
            f"{BASE}/register",
            json={
                "email": "newuser@example.com",
                "password": "SecurePass123",
                "firstName": "New",
                "lastName": "User",
                "role": "student",
            },
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["user"]["email"] == "newuser@example.com"
        assert "token" in data

    def test_register_duplicate_email(self, client):
        """Test registration with existing email."""
        response = client.post(
            f"{BASE}/register",
            json={
                "email": SEEDED_STUDENT_EMAIL,
                "password": "SecurePass123",
                "firstName": "Duplicate",
                "lastName": "User",
                "role": "student",
            },
        )
        assert response.status_code == 409

    def test_register_missing_fields(self, client):
        """Test registration with missing required fields."""
        response = client.post(
            f"{BASE}/register",
            json={"email": "incomplete@example.com", "password": "Pass123"},
        )
        assert response.status_code == 422

    def test_register_invalid_role(self, client):
        """Test registration with invalid role."""
        response = client.post(
            f"{BASE}/register",
            json={
                "email": "roleuser@example.com",
                "password": "Pass123",
                "firstName": "Role",
                "lastName": "User",
                "role": "superhero",
            },
        )
        assert response.status_code == 400


class TestAuthMe:
    """Tests for GET /auth/me"""

    def test_me_authenticated(self, client, student_auth_header):
        """Test getting current user info when authenticated."""
        response = client.get(f"{BASE}/me", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert "email" in data
        assert data["email"] == SEEDED_STUDENT_EMAIL

    def test_me_unauthenticated(self, client):
        """Test getting current user info without authentication."""
        response = client.get(f"{BASE}/me")
        assert response.status_code == 401

    def test_me_invalid_token(self, client):
        """Test getting current user info with invalid token."""
        response = client.get(
            f"{BASE}/me",
            headers={"Authorization": "Bearer invalid_token_here"},
        )
        assert response.status_code == 401


class TestAuthProfileUpdate:
    """Tests for POST /auth/profile/update"""

    def test_update_profile_success(self, client, student_auth_header, verify_otp):
        """Test successful profile update."""
        verify_otp(SEEDED_STUDENT_EMAIL, "profile_update")
        response = client.post(
            f"{BASE}/profile/update",
            json={"firstName": "Updated", "lastName": "Name", "phone": "+919876543210"},
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True

    def test_update_profile_no_change(self, client, student_auth_header, verify_otp):
        """Test profile update with no changes."""
        verify_otp(SEEDED_STUDENT_EMAIL, "profile_update")
        response = client.post(
            f"{BASE}/profile/update",
            json={},
            headers=student_auth_header,
        )
        assert response.status_code == 200

    def test_update_profile_requires_verified_otp(self, client, student_auth_header):
        """Test profile update without verified OTP."""
        response = client.post(
            f"{BASE}/profile/update",
            json={"firstName": "Updated"},
            headers=student_auth_header,
        )
        assert response.status_code == 403


class TestAuthChangePassword:
    """Tests for POST /auth/profile/change-password"""

    def test_change_password_success(self, client, student_auth_header, verify_otp):
        """Test successful password change."""
        verify_otp(SEEDED_STUDENT_EMAIL, "password_change")
        response = client.post(
            f"{BASE}/profile/change-password",
            json={
                "currentPassword": "student123",
                "newPassword": "NewPass456",
                "confirmPassword": "NewPass456",
            },
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
        # Verify new password works
        login = client.post(
            f"{BASE}/login",
            json={"email": SEEDED_STUDENT_EMAIL, "password": "NewPass456"},
        )
        assert login.status_code == 200

    def test_change_password_mismatch(self, client, student_auth_header, verify_otp):
        """Test password change with mismatched confirmPassword."""
        verify_otp(SEEDED_STUDENT_EMAIL, "password_change")
        response = client.post(
            f"{BASE}/profile/change-password",
            json={
                "currentPassword": "student123",
                "newPassword": "NewPass456",
                "confirmPassword": "DifferentPass",
            },
            headers=student_auth_header,
        )
        assert response.status_code == 400

    def test_change_password_wrong_current(self, client, student_auth_header, verify_otp):
        """Test password change with wrong current password."""
        verify_otp(SEEDED_STUDENT_EMAIL, "password_change")
        response = client.post(
            f"{BASE}/profile/change-password",
            json={
                "currentPassword": "wrongcurrent",
                "newPassword": "NewPass456",
                "confirmPassword": "NewPass456",
            },
            headers=student_auth_header,
        )
        assert response.status_code == 400

    def test_change_password_requires_verified_otp(self, client, student_auth_header):
        """Test password change without verified OTP."""
        response = client.post(
            f"{BASE}/profile/change-password",
            json={
                "currentPassword": "student123",
                "newPassword": "NewPass456",
                "confirmPassword": "NewPass456",
            },
            headers=student_auth_header,
        )
        assert response.status_code == 403


class TestAuthLogout:
    """Tests for POST /auth/logout"""

    def test_logout_success(self, client, student_auth_header):
        """Test successful logout."""
        response = client.post(f"{BASE}/logout", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True


class TestAuthRefresh:
    """Tests for POST /auth/refresh"""

    def test_refresh_token(self, client, student_auth_header):
        """Test token refresh."""
        response = client.post(f"{BASE}/refresh", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
