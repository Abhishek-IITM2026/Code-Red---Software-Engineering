def test_list_schedule(student_auth_header, client):
    response = client.get("/api/v1/schedule", headers=student_auth_header)

    assert response.status_code == 200
    assert len(response.get_json()) >= 1


def test_create_schedule(admin_auth_header, client):
    response = client.post(
        "/api/v1/schedule",
        json={
            "classId": "1",
            "subjectId": "1",
            "facultyId": "1",
            "dayOfWeek": 5,
            "timeSlot": {"startTime": "11:00", "endTime": "12:00"},
            "roomNumber": "201",
        },
        headers=admin_auth_header,
    )

    assert response.status_code == 201
    assert response.get_json()["classId"] == "1"


def test_create_schedule_rejects_unknown_fields(admin_auth_header, client):
    response = client.post(
        "/api/v1/schedule",
        json={
            "classId": "1",
            "subjectId": "1",
            "facultyId": "1",
            "dayOfWeek": 5,
            "timeSlot": {"startTime": "11:00", "endTime": "12:00"},
            "roomNumber": "201",
            "unexpected": "value",
        },
        headers=admin_auth_header,
    )

    assert response.status_code == 422
    assert response.get_json()["error"]["code"] == "VALIDATION_ERROR"
