def test_login_returns_user_and_token(client):
    response = client.post("/api/v1/auth/login", json={"email": "student@example.com", "password": "student123"})

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["user"]["email"] == "student@example.com"
    assert payload["token"]


def test_me_requires_auth(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.get_json()["error"]["code"] == "AUTH_REQUIRED"


def test_register_rejects_unknown_fields(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newstudent@example.com",
            "password": "student123",
            "firstName": "New",
            "lastName": "Student",
            "role": "student",
            "unexpected": "value",
        },
    )

    assert response.status_code == 422
    assert response.get_json()["error"]["code"] == "VALIDATION_ERROR"
