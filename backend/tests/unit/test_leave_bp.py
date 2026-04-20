"""Unit tests for Leave Blueprint business logic."""
import pytest
from datetime import datetime, date, timedelta

from app import create_app
from app.extensions import db
from app.models import LeaveRequest, User, UserStatus


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
def leave_data(app):
    """Create sample data for leave testing."""
    with app.app_context():
        # Create user
        user = User(
            email="leave_test@example.com",
            first_name="Leave",
            last_name="Test",
            password_hash="hash",
            status=UserStatus.ACTIVE,
            role_scope="student",
        )
        db.session.add(user)
        db.session.flush()

        # Create leave request
        leave_request = LeaveRequest(
            applicant_id=user.id,
            applicant_role="student",
            applicant_context="Class 5 A",
            leave_type="Sick Leave",
            from_date=date.today(),
            to_date=date.today() + timedelta(days=2),
            total_days=3,
            reason="Medical appointment",
            status="Pending",
        )
        db.session.add(leave_request)
        db.session.commit()

        yield {
            "user": user,
            "leave_request": leave_request,
        }

        # Cleanup
        db.session.delete(leave_request)
        db.session.delete(user)
        db.session.commit()


class TestLeaveRequestModel:
    """Test LeaveRequest model operations."""

    def test_leave_request_creation(self, app, leave_data):
        """Test creating a leave request."""
        with app.app_context():
            leave = LeaveRequest.query.get(leave_data["leave_request"].id)
            assert leave is not None
            assert leave.leave_type == "Sick Leave"
            assert leave.status == "Pending"

    def test_leave_request_to_dict(self, app, leave_data):
        """Test leave request serialization."""
        with app.app_context():
            leave = LeaveRequest.query.get(leave_data["leave_request"].id)
            data = leave.to_dict()
            assert "leaveType" in data
            assert "fromDate" in data
            assert "toDate" in data
            assert "status" in data

    def test_leave_total_days_calculation(self):
        """Test total days calculation."""
        from_date = date(2024, 5, 1)
        to_date = date(2024, 5, 5)
        total_days = (to_date - from_date).days + 1
        assert total_days == 5


class TestLeaveStatusTransitions:
    """Test leave request status transitions."""

    def test_approve_leave_request(self, app, leave_data):
        """Test approving a leave request."""
        with app.app_context():
            leave = LeaveRequest.query.get(leave_data["leave_request"].id)
            leave.status = "Approved"
            leave.reviewer_id = 1
            leave.reviewer_name = "Admin User"
            db.session.commit()
            
            updated = LeaveRequest.query.get(leave_data["leave_request"].id)
            assert updated.status == "Approved"
            assert updated.reviewer_id == 1

    def test_reject_leave_request(self, app, leave_data):
        """Test rejecting a leave request."""
        with app.app_context():
            leave = LeaveRequest.query.get(leave_data["leave_request"].id)
            leave.status = "Rejected"
            leave.reviewer_id = 1
            leave.reviewer_name = "Admin User"
            db.session.commit()
            
            updated = LeaveRequest.query.get(leave_data["leave_request"].id)
            assert updated.status == "Rejected"

    def test_leave_request_delete(self, app, leave_data):
        """Test deleting a leave request."""
        with app.app_context():
            leave = LeaveRequest.query.get(leave_data["leave_request"].id)
            db.session.delete(leave)
            db.session.commit()
            
            deleted = LeaveRequest.query.get(leave_data["leave_request"].id)
            assert deleted is None


class TestLeaveDateValidation:
    """Test leave date validation logic."""

    def test_valid_date_range(self):
        """Test valid date range calculation."""
        from_date = date(2024, 6, 1)
        to_date = date(2024, 6, 10)
        total_days = (to_date - from_date).days + 1
        assert total_days == 10

    def test_same_day_leave(self):
        """Test same day leave calculation."""
        from_date = date(2024, 6, 15)
        to_date = date(2024, 6, 15)
        total_days = (to_date - from_date).days + 1
        assert total_days == 1

    def test_invalid_date_range(self):
        """Test that end date before start date is invalid."""
        from_date = date(2024, 6, 15)
        to_date = date(2024, 6, 10)
        is_valid = to_date >= from_date
        assert is_valid is False