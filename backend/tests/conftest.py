import os
import sys
import logging

import pytest


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import db
from app.models import AdministrationStaff, Student
from app.seed import seed_database
from app.services.seed_validator import SeedDataValidator

logger = logging.getLogger(__name__)

# Updated email addresses matching current seed data format
SEEDED_STUDENT_EMAIL = "student0001.aarav@example.in"
SEEDED_FACULTY_EMAIL = "faculty001.aarav@example.in"
SEEDED_ADMIN_EMAIL = "admin@example.in"
SEEDED_PARENT_EMAIL = "parent0001.aarav@example.in"
SEEDED_DIRECTOR_EMAIL = "director@example.in"


@pytest.fixture(scope="session")
def app():
    app = create_app("testing")
    with app.app_context():
        db.drop_all()
        db.create_all()
        logger.info("Database tables created for testing")
    yield app
    with app.app_context():
        db.drop_all()
        logger.info("Database cleaned up after testing")


@pytest.fixture(autouse=True)
def seeded_database(app):
    """
    Auto-seeded database fixture with integrity validation.
    Ensures both SQL and NoSQL data is properly initialized and cleaned.
    """
    with app.app_context():
        # Force seed with full cleanup
        seed_database(force=True)
        
        # Validate data integrity
        sql_valid, sql_issues = SeedDataValidator.validate_sql_integrity()
        mongo_valid, mongo_issues = SeedDataValidator.validate_mongodb_integrity(app.document_store)
        
        if sql_issues:
            logger.warning(f"SQL validation issues: {sql_issues}")
        if mongo_issues:
            logger.warning(f"MongoDB validation issues: {mongo_issues}")
        
        if not sql_valid:
            raise RuntimeError(f"Seed data integrity check failed: {sql_issues}")
        
        # Log seed summary
        summary = SeedDataValidator.get_seed_summary()
        logger.info(f"✓ Seed data validated: {summary}")
        
        yield
        
        # Cleanup after test
        db.session.remove()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def student_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": SEEDED_STUDENT_EMAIL, "password": "student123"})
    assert response.status_code == 200, response.get_json()
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def faculty_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": SEEDED_FACULTY_EMAIL, "password": "faculty123"})
    assert response.status_code == 200, response.get_json()
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": SEEDED_ADMIN_EMAIL, "password": "admin123"})
    assert response.status_code == 200, response.get_json()
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def parent_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": SEEDED_PARENT_EMAIL, "password": "parent123"})
    assert response.status_code == 200, response.get_json()
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def director_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": SEEDED_DIRECTOR_EMAIL, "password": "admin123"})
    assert response.status_code == 200, response.get_json()
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def seeded_student(app):
    with app.app_context():
        return Student.query.order_by(Student.id.asc()).first()


@pytest.fixture()
def seeded_staff_user_id(app):
    with app.app_context():
        staff = AdministrationStaff.query.order_by(AdministrationStaff.id.asc()).first()
        assert staff is not None
        return staff.user_id


@pytest.fixture()
def verify_otp(client):
    def _verify(email: str, purpose: str):
        send_response = client.post(
            "/api/v1/auth/otp/send",
            json={"email": email, "purpose": purpose},
        )
        assert send_response.status_code == 200, send_response.get_json()
        otp = send_response.get_json()["otp"]

        verify_response = client.post(
            "/api/v1/auth/otp/verify",
            json={"email": email, "purpose": purpose, "otp": otp},
        )
        assert verify_response.status_code == 200, verify_response.get_json()
        return otp

    return _verify
