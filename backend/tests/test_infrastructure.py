from app import create_app


def test_app_falls_back_to_in_memory_services_when_redis_is_unavailable():
    app = create_app()

    assert app.config["CELERY_BROKER_URL"] == "memory://"
    assert app.config["CELERY_RESULT_BACKEND"] == "cache+memory://"
    assert app.config["RATELIMIT_STORAGE_URI"] == "memory://"
    assert app.config["CELERY_TASK_ALWAYS_EAGER"] is True


def test_schedule_notification_queues_job(admin_auth_header, client):
    response = client.post(
        "/api/v1/notifications/schedule",
        json={"message": "Schedule changed", "recipientScope": "all"},
        headers=admin_auth_header,
    )

    assert response.status_code == 202
    payload = response.get_json()
    assert payload["success"] is True
    assert payload["taskId"]


def test_job_status_endpoint_returns_task_metadata(admin_auth_header, client):
    notification = client.post(
        "/api/v1/notifications/schedule",
        json={"message": "Schedule changed", "recipientScope": "faculty"},
        headers=admin_auth_header,
    )
    task_id = notification.get_json()["taskId"]

    response = client.get(f"/api/v1/jobs/{task_id}", headers=admin_auth_header)

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["taskId"] == task_id
    assert "status" in payload
    assert "ready" in payload
