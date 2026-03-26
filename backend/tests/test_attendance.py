from datetime import date


def test_get_attendance_by_student(student_auth_header, client):
    response = client.get("/api/v1/attendance?studentId=1", headers=student_auth_header)

    assert response.status_code == 200
    assert isinstance(response.get_json(), list)


def test_create_attendance_sheet(faculty_auth_header, client):
    response = client.post(
        "/api/v1/attendance",
        json={
            "date": date.today().isoformat(),
            "class": "1",
            "section": "A",
            "records": [{"studentId": "1", "subjectId": "1", "status": "present"}],
        },
        headers=faculty_auth_header,
    )

    assert response.status_code == 201
    assert response.get_json()["success"] is True


def test_create_attendance_sheet_rejects_unknown_fields(faculty_auth_header, client):
    response = client.post(
        "/api/v1/attendance",
        json={
            "date": date.today().isoformat(),
            "class": "1",
            "section": "A",
            "records": [{"studentId": "1", "subjectId": "1", "status": "present", "extra": "nope"}],
        },
        headers=faculty_auth_header,
    )

    assert response.status_code == 422
    assert response.get_json()["error"]["code"] == "VALIDATION_ERROR"
