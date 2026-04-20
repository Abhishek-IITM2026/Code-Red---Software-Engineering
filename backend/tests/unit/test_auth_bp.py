"""Unit tests for Auth Blueprint models and business logic."""
import pytest
from datetime import datetime, timedelta

from app import create_app
from app.extensions import db
from app.models import User, UserStatus, Student, Faculty, AdministrationStaff
from app.common.auth import generate_token, verify_token, normalize_role_name, user_role_names


@pytest.fixture(scope="module")
def app():
    """Create application for unit testing."""
    app = create_app("testing")
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def sample_user(app):
    """Create a sample user for testing."""
    with app.app_context():
        user = User(
            email="testuser@example.com",
            first_name="Test",
            last_name="User",
            password_hash="hashed_password",
            status=UserStatus.ACTIVE,
            role_scope="student",
        )
        db.session.add(user)
        db.session.commit()
        yield user
        db.session.delete(user)
        db.session.commit()


class TestTokenGeneration:
    """Test token generation and verification logic."""

    def test_generate_token_returns_string(self, app, sample_user):
        """Test that generate_token returns a string token."""
        with app.app_context():
            token = generate_token(sample_user.id)
            assert isinstance(token, str)
            assert len(token) > 0

    def test_verify_valid_token(self, app, sample_user):
        """Test that a valid token can be verified."""
        with app.app_context():
            token = generate_token(sample_user.id)
            payload = verify_token(token)
            assert payload["user_id"] == sample_user.id

    def test_verify_invalid_token_raises_error(self, app):
        """Test that an invalid token raises ApiError."""
        from app.api.errors import ApiError
        with app.app_context():
            with pytest.raises(ApiError):
                verify_token("invalid_token")

    def test_token_expiry(self, app, sample_user):
        """Test that expired tokens raise SignatureExpired error."""
        from itsdangerous import SignatureExpired
        with app.app_context():
            token = generate_token(sample_user.id)
            with pytest.raises(SignatureExpired):
                verify_token(token)


class TestRoleNormalization:
    """Test role normalization functions."""

    def test_normalize_role_name_lowercase(self):
        """Test that role names are normalized to lowercase."""
        assert normalize_role_name("Admin") == "admin"
        assert normalize_role_name("  FACULTY  ") == "faculty"
        assert normalize_role_name(None) == ""
        assert normalize_role_name("") == ""

    def test_user_role_names_student(self, app, sample_user):
        """Test user_role_names for a student."""
        with app.app_context():
            roles = user_role_names(sample_user)
            assert "student" in roles


class TestUserModel:
    """Test User model operations."""

    def test_user_creation(self, app):
        """Test creating a new user."""
        with app.app_context():
            user = User(
                email="newuser@test.com",
                first_name="New",
                last_name="User",
                password_hash="hash123",
                status=UserStatus.ACTIVE,
                role_scope="student",
            )
            db.session.add(user)
            db.session.commit()
            assert user.id is not None
            assert user.email == "newuser@test.com"
            db.session.delete(user)
            db.session.commit()

    def test_user_to_dict(self, app, sample_user):
        """Test user serialization."""
        with app.app_context():
            user_dict = sample_user.to_dict()
            assert "email" in user_dict
            assert "firstName" in user_dict
            assert "lastName" in user_dict