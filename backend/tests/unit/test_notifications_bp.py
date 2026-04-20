"""Unit tests for Notifications Blueprint business logic."""
import pytest
from datetime import datetime

from app import create_app
from app.extensions import db
from app.models import NotificationBatch, EmailMessage, User, UserStatus


@pytest.fixture(scope="module")
def app():
    """Create application for unit testing."""
    app = create_app("testing")
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def notification_data(app):
    """Create sample data for notifications testing."""
    with app.app_context():
        # Create user
        user = User(
            email="notify_test@example.com",
            first_name="Notify",
            last_name="Test",
            password_hash="hash",
            status=UserStatus.ACTIVE,
            role_scope="administration",
        )
        db.session.add(user)
        db.session.flush()

        # Create notification batch
        batch = NotificationBatch(
            batch_type="SCHEDULE_UPDATE",
            title="Test Notification",
            message="This is a test notification",
            created_by=user.id,
        )
        db.session.add(batch)
        db.session.commit()

        yield {
            "user": user,
            "batch": batch,
        }

        # Cleanup
        db.session.delete(batch)
        db.session.delete(user)
        db.session.commit()


class TestNotificationBatchModel:
    """Test NotificationBatch model operations."""

    def test_batch_creation(self, app, notification_data):
        """Test creating a notification batch."""
        with app.app_context():
            batch = NotificationBatch.query.get(notification_data["batch"].id)
            assert batch is not None
            assert batch.batch_type == "SCHEDULE_UPDATE"

    def test_batch_to_dict(self, app, notification_data):
        """Test notification batch serialization."""
        with app.app_context():
            batch = NotificationBatch.query.get(notification_data["batch"].id)
            data = batch.to_dict()
            assert "batchType" in data
            assert "title" in data
            assert "message" in data

    def test_batch_creation_time(self, app, notification_data):
        """Test batch creation timestamp."""
        with app.app_context():
            batch = NotificationBatch.query.get(notification_data["batch"].id)
            assert batch.created_at is not None


class TestEmailMessageModel:
    """Test EmailMessage model operations."""

    def test_email_message_creation(self, app):
        """Test creating an email message."""
        with app.app_context():
            email = EmailMessage(
                recipients=["test@example.com"],
                subject="Test Email",
                text_body="This is a test email",
                direction="outgoing",
                status="sent",
                created_by=1,
            )
            db.session.add(email)
            db.session.commit()
            assert email.id is not None
            db.session.delete(email)
            db.session.commit()

    def test_email_message_to_dict(self, app):
        """Test email message serialization."""
        with app.app_context():
            email = EmailMessage(
                recipients=["test@example.com"],
                subject="Test Email",
                text_body="This is a test email",
                direction="outgoing",
                status="sent",
                created_by=1,
            )
            db.session.add(email)
            db.session.commit()
            data = email.to_dict()
            assert "recipients" in data
            assert "subject" in data
            db.session.delete(email)
            db.session.commit()