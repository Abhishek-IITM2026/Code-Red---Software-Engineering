def test_list_students(admin_auth_header, client):
    response = client.get("/api/v1/students", headers=admin_auth_header)

    assert response.status_code == 200
    students = response.get_json()
    assert len(students) >= 1
    assert students[0]["firstName"] == "Neha"


def test_get_current_student(student_auth_header, client):
    response = client.get("/api/v1/students/me", headers=student_auth_header)

    assert response.status_code == 200
    assert response.get_json()["email"] == "student@example.com"
