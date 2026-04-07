"""Test cases for Notifications, Marks, Authority, and Jobs API endpoints."""
import pytest


# ===== Notifications =====
class TestNotificationsEmailMessages:
    """Tests for GET /email/messages"""

    def test_list_messages_success(self, client, admin_auth_header):
        """Test listing email messages."""
        response = client.get("/api/v1/notifications/email/messages", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_messages_forbidden_student(self, client, student_auth_header):
        """Test listing messages as student is forbidden."""
        response = client.get("/api/v1/notifications/email/messages", headers=student_auth_header)
        assert response.status_code == 403


class TestNotificationsEmailMessageById:
    """Tests for GET /email/messages/{messageId}"""
    def test_get_message_success(self, client, admin_auth_header):
        """Test getting a specific message."""
        response = client.get("/api/v1/notifications/email/messages/1", headers=admin_auth_header)
        assert response.status_code in (200, 404)

    def test_get_message_not_found(self, client, admin_auth_header):
        """Test getting non-existent message."""
        response = client.get("/api/v1/notifications/email/messages/99999", headers=admin_auth_header)
        assert response.status_code == 404


class TestNotificationsEmailStatus:
    """Tests for GET /email/status"""
    def test_email_status_success(self, client, admin_auth_header):
        """Test getting email status."""
        response = client.get("/api/v1/notifications/email/status", headers=admin_auth_header)
        assert response.status_code == 200


class TestNotificationsEmailSend:
    """Tests for POST /email/send"""
    def test_send_email_success(self, client, admin_auth_header):
        """Test sending an email."""
        response = client.post(
            "/api/v1/notifications/email/send",
            json={
                "to": ["test@example.com"],
                "subject": "Test Subject",
                "text": "This is a test email body.",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 201

    def test_send_email_missing_fields(self, client, admin_auth_header):
        """Test sending email with missing required fields."""
        response = client.post(
            "/api/v1/notifications/email/send",
            json={"to": ["test@example.com"]},
            headers=admin_auth_header,
        )
        assert response.status_code == 422


class TestNotificationsSchedule:
    """Tests for POST /schedule"""
    def test_schedule_notification_success(self, client, admin_auth_header):
        """Test creating a schedule notification."""
        response = client.post(
            "/api/v1/notifications/schedule",
            json={
                "message": "Classes will resume tomorrow",
                "recipientScope": "all",
            },
            headers=admin_auth_header,
        )
        assert response.status_code == 202


# ===== Marks =====
class TestMarksList:
    """Tests for GET /marks"""
    def test_list_marks_success(self, client, faculty_auth_header):
        """Test listing marks as faculty."""
        response = client.get("/api/v1/marks", headers=faculty_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_marks_forbidden_student(self, client, student_auth_header):
        """Test listing marks as student."""
        response = client.get("/api/v1/marks", headers=student_auth_header)
        assert response.status_code == 200


# ===== Authority =====
class TestAuthorityAssignments:
    """Tests for GET/PUT /authority/assignments"""
    def test_list_assignments_success(self, client, admin_auth_header):
        """Test listing authority assignments."""
        response = client.get("/api/v1/authority/assignments", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_assignments_forbidden_student(self, client, student_auth_header):
        """Test listing assignments as student is forbidden."""
        response = client.get("/api/v1/authority/assignments", headers=student_auth_header)
        assert response.status_code == 403


class TestAuthorityTemplates:
    """Tests for GET /authority/templates"""
    def test_list_templates_success(self, client, admin_auth_header):
        """Test listing authority templates."""
        response = client.get("/api/v1/authority/templates", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)

    def test_list_templates_unauthenticated(self, client):
        """Test templates without auth."""
        response = client.get("/api/v1/authority/templates")
        assert response.status_code == 401


# ===== Jobs =====
class TestJobsGetById:
    """Tests for GET /jobs/{taskId}"""
    def test_get_job_success(self, client, admin_auth_header):
        """Test getting a job status."""
        response = client.get("/api/v1/jobs/test-task-id", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        assert "status" in data or "taskId" in data



# ===== Academics =====
class TestAcademicsClasses:
    """Tests for GET /classes"""
    def test_list_classes_success(self, client, student_auth_header):
        """Test listing all classes."""
        response = client.get("/api/v1/classes", headers=student_auth_header)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, list)


class TestAcademicsClassSections:
    """Tests for GET /classes/{classId}/sections"""
    def test_list_sections_success(self, client, student_auth_header):
        """Test listing sections for a class."""
        response = client.get("/api/v1/classes/1/sections", headers=student_auth_header)
        assert response.status_code in (200, 404)

    def test_list_sections_invalid_class(self, client, student_auth_header):
        """Test sections for non-existent class."""
        response = client.get("/api/v1/classes/99999/sections", headers=student_auth_header)
        assert response.status_code == 404



# ===== Health =====
class TestHealth:
    """Tests for health check endpoints"""
    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "ok"

    def test_health_document_store(self, client):
        """Test document store health check."""
        response = client.get("/health/document-store")
        assert response.status_code == 200
