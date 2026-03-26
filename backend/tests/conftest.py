import os
import sys

import pytest


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import db
from app.seed import seed_database


@pytest.fixture()
def app():
    app = create_app("testing")
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed_database()
        yield app


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def student_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": "student@example.com", "password": "student123"})
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def faculty_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": "faculty@example.com", "password": "faculty123"})
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def parent_auth_header(client):
    response = client.post("/api/v1/auth/login", json={"email": "parent@example.com", "password": "parent123"})
    token = response.get_json()["token"]
    return {"Authorization": f"Bearer {token}"}
