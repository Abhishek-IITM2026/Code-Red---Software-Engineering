from app.config import build_database_uri


def test_student_cannot_list_all_students(student_auth_header, client):
    response = client.get("/api/v1/students", headers=student_auth_header)

    assert response.status_code == 403
    assert response.get_json()["error"]["code"] == "FORBIDDEN"


def test_parent_can_access_linked_child(parent_auth_header, client):
    response = client.get("/api/v1/parent/children/1", headers=parent_auth_header)

    assert response.status_code == 200
    assert response.get_json()["id"] == "1"


def test_admin_can_create_schedule_but_student_cannot(student_auth_header, admin_auth_header, client):
    payload = {
        "classId": "1",
        "subjectId": "1",
        "facultyId": "1",
        "dayOfWeek": 2,
        "timeSlot": {"startTime": "08:00", "endTime": "09:00"},
    }

    forbidden_response = client.post("/api/v1/schedule", json=payload, headers=student_auth_header)
    allowed_response = client.post("/api/v1/schedule", json=payload, headers=admin_auth_header)

    assert forbidden_response.status_code == 403
    assert allowed_response.status_code == 201


def test_database_uri_can_switch_to_postgres(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("DB_ENGINE", "postgresql")
    monkeypatch.setenv("POSTGRES_HOST", "db")
    monkeypatch.setenv("POSTGRES_PORT", "5432")
    monkeypatch.setenv("POSTGRES_USER", "codered")
    monkeypatch.setenv("POSTGRES_PASSWORD", "secret")
    monkeypatch.setenv("POSTGRES_DB", "codered_db")

    assert build_database_uri() == "postgresql+psycopg2://codered:secret@db:5432/codered_db"
