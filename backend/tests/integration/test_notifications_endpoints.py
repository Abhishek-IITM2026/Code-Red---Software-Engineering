"""Integration tests for Notifications Blueprint API endpoints."""
import pytest

from app import create_app
from app.extensions import db
from app.seed import seed_database


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
def admin_auth(client):
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_ADMIN_EMAIL,
        "password": "admin123"
    })
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['token']}"}


class TestScheduleNotificationEndpoint:
    """Test POST /api/v1/notifications/schedule"""

    def test_schedule_notification(self, client, admin_auth):
        """Test scheduling a notification."""
        response = client.post("/api/v1/notifications/schedule", headers=admin_auth, json={
            "message": "Test notification message",
            "recipientScope": "all"
        })
        assert response.status_code == 202

    def test_schedule_notification_unauthenticated(self, client):
        """Test scheduling without auth fails."""
        response = client.post("/api/v1/notifications/schedule", json={
            "message": "Test"
        })
        assert response.status_code == 401


class TestEmailStatusEndpoint:
    """Test GET /api/v1/notifications/email/status"""

    def test_get_email_status(self, client, admin_auth):
        """Test getting email transport status."""
        response = client.get("/api/v1/notifications/email/status", headers=admin_auth)
        assert response.status_code == 200


class TestSendEmailEndpoint:
    """Test POST /api/v1/notifications/email/send"""

    def test_send_email(self, client, admin_auth):
        """Test sending an email."""
        response = client.post("/api/v1/notifications/email/send", headers=admin_auth, json={
            "to": ["test@example.com"],
            "subject": "Test Email",
            "text": "This is a test email"
        })
        assert response.status_code == 201

    def test_send_email_missing_fields(self, client, admin_auth):
        """Test sending email with missing fields."""
        response = client.post("/api/v1/notifications/email/send", headers=admin_auth, json={
            "to": ["test@example.com"]
        })
        assert response.status_code == 422


class TestEmailMessagesEndpoint:
    """Test GET /api/v1/notifications/email/messages"""

    def test_list_email_messages(self, client, admin_auth):
        """Test listing email messages."""
        response = client.get("/api/v1/notifications/email/messages", headers=admin_auth)
        assert response.status_code == 200
        data = response.get_json()
        assert "data" in data

    def test_list_email_messages_with_filters(self, client, admin_auth):
        """Test listing email messages with filters."""
        response = client.get(
            "/api/v1/notifications/email/messages?direction=incoming&limit=10",
            headers=admin_auth
        )
        assert response.status_code == 200


class TestEmailSyncEndpoint:
    """Test POST /api/v1/notifications/email/sync"""

    def test_sync_emails(self, client, admin_auth):
        """Test syncing emails."""
        response = client.post("/api/v1/notifications/email/sync", headers=admin_auth, json={
            "limit": 10,
            "mailbox": "INBOX",
            "unseenOnly": False
        })
        assert response.status_code == 200
