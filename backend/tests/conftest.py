"""
Pytest configuration and shared fixtures for backend tests.
"""
import os
import sys
import logging

import pytest

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import db
from app.seed import seed_database

logger = logging.getLogger(__name__)

# Seed data email addresses
SEEDED_STUDENT_EMAIL = "student0001.aarav@example.in"
SEEDED_FACULTY_EMAIL = "faculty001.aarav@example.in"
SEEDED_ADMIN_EMAIL = "admin@example.in"
SEEDED_PARENT_EMAIL = "parent0001.aarav@example.in"
SEEDED_DIRECTOR_EMAIL = "director@example.in"


@pytest.fixture(scope="session")
def app():
    """Create application for the test session."""
    app = create_app("testing")
    app.config["TESTING"] = True
    app.config["WTF_CSRF_ENABLED"] = False
    
    with app.app_context():
        db.drop_all()
        db.create_all()
        logger.info("Database tables created for testing")
        
        # Seed the database with test data
        seed_database(force=True)
        logger.info("Database seeded with test data")
    
    yield app
    
    with app.app_context():
        db.drop_all()
        logger.info("Database cleaned up after testing")


@pytest.fixture()
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture()
def student_auth(client):
    """Get student authentication token."""
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_STUDENT_EMAIL,
        "password": "student123"
    })
    assert response.status_code == 200, f"Student login failed: {response.get_json()}"
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def faculty_auth(client):
    """Get faculty authentication token."""
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_FACULTY_EMAIL,
        "password": "faculty123"
    })
    assert response.status_code == 200, f"Faculty login failed: {response.get_json()}"
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_auth(client):
    """Get admin authentication token."""
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_ADMIN_EMAIL,
        "password": "admin123"
    })
    assert response.status_code == 200, f"Admin login failed: {response.get_json()}"
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def parent_auth(client):
    """Get parent authentication token."""
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_PARENT_EMAIL,
        "password": "parent123"
    })
    assert response.status_code == 200, f"Parent login failed: {response.get_json()}"
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def director_auth(client):
    """Get director authentication token."""
    response = client.post("/api/v1/auth/login", json={
        "email": SEEDED_DIRECTOR_EMAIL,
        "password": "admin123"
    })
    assert response.status_code == 200, f"Director login failed: {response.get_json()}"
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def verify_otp(client):
    """Helper fixture to verify OTP for protected endpoints."""
    def _verify(email: str, purpose: str):
        send_response = client.post(
            "/api/v1/auth/otp/send",
            json={"email": email, "purpose": purpose},
        )
        if send_response.status_code != 200:
            pytest.skip(f"OTP not available: {send_response.get_json()}")
        
        otp = send_response.get_json().get("otp")
        if not otp:
            pytest.skip("OTP not returned in response")

        verify_response = client.post(
            "/api/v1/auth/otp/verify",
            json={"email": email, "purpose": purpose, "otp": otp},
        )
        assert verify_response.status_code == 200, f"OTP verification failed: {verify_response.get_json()}"
        return otp

    return _verify
