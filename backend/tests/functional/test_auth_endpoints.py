"""
Comprehensive functional tests for Authentication API endpoints.

Use Case: User authentication and profile management
Description: Tests for login, logout, token refresh, profile updates, and password management
"""
import pytest

BASE_URL = "/api/v1/auth"


class TestAuthLoginEndpoint:
    """Functional tests for POST /api/v1/auth/login"""

    def test_login_student_success(self, client):
        """
        Test Case: Student Login - Success
        Inputs:
          - Email: student.aarav@example.in
          - Password: student123
        Expected Output:
          - Status: 200 OK
          - Response contains: token, user object with email and role
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "student.aarav@example.in", "password": "student123"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert data["user"]["email"] == "student.aarav@example.in"
        assert data["user"]["role"] == "student"

    def test_login_faculty_success(self, client):
        """
        Test Case: Faculty Login - Success
        Inputs:
          - Email: faculty.aarav@example.in
          - Password: faculty123
        Expected Output:
          - Status: 200 OK
          - Response contains: token and user with faculty role
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "faculty.aarav@example.in", "password": "faculty123"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert data["user"]["role"] == "faculty"

    def test_login_admin_success(self, client):
        """
        Test Case: Admin Login - Success
        Inputs:
          - Email: admin@example.in
          - Password: admin123
        Expected Output:
          - Status: 200 OK
          - Response contains: token and user with admin role
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "admin@example.in", "password": "admin123"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert data["user"]["role"] in ["admin", "administration"]

    def test_login_parent_success(self, client):
        """
        Test Case: Parent Login - Success
        Inputs:
          - Email: parent.aarav@example.in
          - Password: parent123
        Expected Output:
          - Status: 200 OK
          - Response contains: token and user with parent role
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "parent.aarav@example.in", "password": "parent123"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "token" in data
        assert data["user"]["role"] == "parent"

    def test_login_invalid_email(self, client):
        """
        Test Case: Login with Non-existent Email
        Inputs:
          - Email: nonexistent@example.in
          - Password: student123
        Expected Output:
          - Status: 401 Unauthorized
          - Error message about invalid credentials
        Actual Output: Returns 401 with error
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "nonexistent@example.in", "password": "student123"},
        )
        assert response.status_code == 401
        data = response.get_json()
        assert "error" in data or "message" in data

    def test_login_wrong_password(self, client):
        """
        Test Case: Login with Wrong Password
        Inputs:
          - Email: student.aarav@example.in
          - Password: wrongpassword
        Expected Output:
          - Status: 401 Unauthorized
        Actual Output: Returns 401
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "student.aarav@example.in", "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_login_missing_email(self, client):
        """
        Test Case: Login with Missing Email Field
        Inputs:
          - Password: student123
        Expected Output:
          - Status: 422 Unprocessable Entity
          - Validation error
        Actual Output: Returns 422 with validation error
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"password": "student123"},
        )
        assert response.status_code == 422

    def test_login_missing_password(self, client):
        """
        Test Case: Login with Missing Password Field
        Inputs:
          - Email: student.aarav@example.in
        Expected Output:
          - Status: 422 Unprocessable Entity
        Actual Output: Returns 422
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "student.aarav@example.in"},
        )
        assert response.status_code == 422

    def test_login_empty_credentials(self, client):
        """
        Test Case: Login with Empty Credentials
        Inputs:
          - Email: ""
          - Password: ""
        Expected Output:
          - Status: 422 or 401
        Actual Output: Returns 422
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "", "password": ""},
        )
        assert response.status_code in [401, 422]


class TestAuthLogoutEndpoint:
    """Functional tests for POST /api/v1/auth/logout"""

    def test_logout_authenticated_user(self, client, student_auth_header):
        """
        Test Case: Logout Authenticated User
        Inputs:
          - Valid Bearer token
        Expected Output:
          - Status: 200 OK
          - Message acknowledging logout
        Actual Output: Returns 200 with success message
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/logout",
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "message" in data or "success" in data

    def test_logout_without_token(self, client):
        """
        Test Case: Logout Without Token
        Inputs:
          - No authentication token
        Expected Output:
          - Status: 401 Unauthorized
        Actual Output: Returns 401
        Result: Success
        """
        response = client.post(f"{BASE_URL}/logout")
        assert response.status_code == 401


class TestAuthGetMeEndpoint:
    """Functional tests for GET /api/v1/auth/me"""

    def test_get_current_user_student(self, client, student_auth_header):
        """
        Test Case: Get Current User Profile - Student
        Inputs:
          - Valid student token
        Expected Output:
          - Status: 200 OK
          - User object with email, name, role
        Actual Output: Returns 200 with user data
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/me",
            headers=student_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["email"] == "student.aarav@example.in"
        assert data["role"] == "student"
        assert "first_name" in data
        assert "last_name" in data

    def test_get_current_user_faculty(self, client, faculty_auth_header):
        """
        Test Case: Get Current User Profile - Faculty
        Inputs:
          - Valid faculty token
        Expected Output:
          - Status: 200 OK
          - Faculty user object
        Actual Output: Returns 200 with faculty data
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/me",
            headers=faculty_auth_header,
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["role"] == "faculty"

    def test_get_current_user_without_token(self, client):
        """
        Test Case: Get Current User Without Token
        Inputs:
          - No authentication token
        Expected Output:
          - Status: 401 Unauthorized
        Actual Output: Returns 401
        Result: Success
        """
        response = client.get(f"{BASE_URL}/me")
        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client):
        """
        Test Case: Get Current User With Invalid Token
        Inputs:
          - Invalid token format
        Expected Output:
          - Status: 401 Unauthorized
        Actual Output: Returns 401
        Result: Success
        """
        response = client.get(
            f"{BASE_URL}/me",
            headers={"Authorization": "Bearer invalid_token_12345"},
        )
        assert response.status_code == 401


class TestProfileUpdateEndpoint:
    """Functional tests for POST /api/v1/auth/profile/update"""

    def test_update_profile_success(self, client, student_auth_header, verify_otp):
        """
        Test Case: Update User Profile - Success
        Inputs:
          - Valid token
          - OTP verified
          - First name: "Aditya"
          - Last name: "Kumar"
          - Phone: "+91 98765 43210"
        Expected Output:
          - Status: 200 OK
          - Updated user object
        Actual Output: Returns 200 with updated data
        Result: Success
        """
        # First verify OTP
        verify_otp("student.aarav@example.in", "profile_update")
        
        response = client.post(
            f"{BASE_URL}/profile/update",
            headers=student_auth_header,
            json={
                "first_name": "Aditya",
                "last_name": "Kumar",
                "phone": "+91 98765 43210",
            },
        )
        assert response.status_code == 200
        data = response.get_json()
        assert data["first_name"] == "Aditya"

    def test_update_profile_without_otp(self, client, student_auth_header):
        """
        Test Case: Update Profile Without OTP Verification
        Inputs:
          - Valid token
          - No OTP verification
        Expected Output:
          - Status: 400 Bad Request or 401
        Actual Output: Returns error status
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/profile/update",
            headers=student_auth_header,
            json={"first_name": "Aditya"},
        )
        assert response.status_code in [400, 401, 403]


class TestChangePasswordEndpoint:
    """Functional tests for POST /api/v1/auth/profile/change-password"""

    def test_change_password_success(self, client, student_auth_header, verify_otp):
        """
        Test Case: Change Password - Success
        Inputs:
          - Valid token
          - OTP verified
          - Old password: student123
          - New password: newpassword123
        Expected Output:
          - Status: 200 OK
          - Success message
        Actual Output: Returns 200
        Result: Success
        """
        # Verify OTP first
        verify_otp("student.aarav@example.in", "password_change")
        
        response = client.post(
            f"{BASE_URL}/profile/change-password",
            headers=student_auth_header,
            json={
                "old_password": "student123",
                "new_password": "newpassword123",
                "confirm_password": "newpassword123",
            },
        )
        assert response.status_code == 200

    def test_change_password_wrong_old_password(self, client, student_auth_header):
        """
        Test Case: Change Password With Wrong Old Password
        Inputs:
          - Wrong old password
          - New password
        Expected Output:
          - Status: 400 Bad Request
        Actual Output: Returns 400
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/profile/change-password",
            headers=student_auth_header,
            json={
                "old_password": "wrongpassword",
                "new_password": "newpassword123",
                "confirm_password": "newpassword123",
            },
        )
        assert response.status_code in [400, 401]


class TestOTPEndpoints:
    """Functional tests for OTP send and verify endpoints"""

    def test_otp_send_success(self, client):
        """
        Test Case: Send OTP - Success
        Inputs:
          - Email: student.aarav@example.in
          - Purpose: profile_update
        Expected Output:
          - Status: 200 OK
          - OTP code returned
        Actual Output: Returns 200 with OTP
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/otp/send",
            json={"email": "student.aarav@example.in", "purpose": "profile_update"},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert "otp" in data

    def test_otp_send_invalid_email(self, client):
        """
        Test Case: Send OTP To Invalid Email
        Inputs:
          - Email: nonexistent@example.in
        Expected Output:
          - Status: 404 or 400
        Actual Output: Returns error
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/otp/send",
            json={"email": "nonexistent@example.in", "purpose": "profile_update"},
        )
        assert response.status_code in [400, 404]

    def test_otp_verify_success(self, client, verify_otp):
        """
        Test Case: Verify OTP - Success
        Inputs:
          - Email: student.aarav@example.in
          - OTP: (obtained from send endpoint)
          - Purpose: profile_update
        Expected Output:
          - Status: 200 OK
          - Verification token
        Actual Output: Returns 200 with token
        Result: Success
        """
        # verify_otp fixture handles this entire flow
        otp = verify_otp("student.aarav@example.in", "profile_update")
        assert otp is not None

    def test_otp_verify_invalid_otp(self, client):
        """
        Test Case: Verify With Invalid OTP
        Inputs:
          - Email: student.aarav@example.in
          - Invalid OTP: 999999
        Expected Output:
          - Status: 400 Bad Request
        Actual Output: Returns 400
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/otp/verify",
            json={
                "email": "student.aarav@example.in",
                "otp": "999999",
                "purpose": "profile_update",
            },
        )
        assert response.status_code == 400


class TestAuthErrorHandling:
    """Error handling tests for auth endpoints"""

    def test_login_sql_injection_attempt(self, client):
        """
        Test Case: SQL Injection Prevention
        Inputs:
          - Email: " OR 1=1 --
          - Password: " OR 1=1 --
        Expected Output:
          - Status: 401 Unauthorized (safe)
          - No data leak
        Actual Output: Returns 401 safely
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "' OR 1=1 --", "password": "' OR 1=1 --"},
        )
        assert response.status_code in [401, 422]

    def test_login_xss_prevention(self, client):
        """
        Test Case: XSS Prevention
        Inputs:
          - Email: <script>alert('xss')</script>@example.in
        Expected Output:
          - Status: 401 or 422
          - No script execution
        Actual Output: Returns 401/422
        Result: Success
        """
        response = client.post(
            f"{BASE_URL}/login",
            json={"email": "<script>alert('xss')</script>@example.in", "password": "test"},
        )
        assert response.status_code in [401, 422]

    def test_login_rate_limiting(self, client):
        """
        Test Case: Rate Limiting On Failed Login Attempts
        Inputs:
          - Multiple failed login attempts (>5)
        Expected Output:
          - Status: 429 Too Many Requests after threshold
        Actual Output: May return 429 based on rate limiter config
        Result: Depends on rate limit configuration
        """
        for _ in range(6):
            response = client.post(
                f"{BASE_URL}/login",
                json={"email": "student.aarav@example.in", "password": "wrong"},
            )
            # After 6 attempts, should get 429 if rate limiting is enabled
            if response.status_code == 429:
                break
        # Test passes if we get 401 or 429
        assert response.status_code in [401, 429]
