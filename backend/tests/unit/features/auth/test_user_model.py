import pytest
from app.models import User

def test_user_model_to_dict():
    """Unit test for User model serialization."""
    user = User(
        email="test@example.com",
        password="hashed_password",
        full_name="Test User",
        role="faculty"
    )
    user_dict = user.to_dict()
    assert user_dict["email"] == "test@example.com"
    assert user_dict["full_name"] == "Test User"
    assert user_dict["role"] == "faculty"

def test_user_role_validation():
    """Test user role logic if applicable."""
    user = User(role="admin")
    # Example: if the model has a method to check roles
    # assert user.has_role("admin") is True
    pass
