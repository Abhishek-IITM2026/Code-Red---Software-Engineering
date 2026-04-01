from app.models import InstituteClass, User, UserContactProfile


def test_user_model_keeps_phone_out_of_users_table():
    assert "phone" not in User.__table__.columns.keys()
    assert "phone_number" in UserContactProfile.__table__.columns.keys()


def test_student_subject_content(student_auth_header, client):
    response = client.get("/api/v1/students/me/subjects/1/content", headers=student_auth_header)

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["subjectId"] == "1"
    assert len(payload["materials"]) >= 1


def test_publish_material(faculty_auth_header, client):
    response = client.post(
        "/api/v1/faculty/subjects/1/materials",
        json={
            "title": "Quadratic Equations",
            "unit": "Unit 2",
            "week": "Week 3",
            "type": "Worksheet",
            "description": "Extra practice questions",
        },
        headers=faculty_auth_header,
    )

    assert response.status_code == 201
    assert response.get_json()["title"] == "Quadratic Equations"


def test_inventory_request_flow(faculty_auth_header, admin_auth_header, client):
    create_response = client.post(
        "/api/v1/inventory/requests",
        json={
            "department": "Mathematics",
            "items": [{"itemId": 1, "quantity": 3}],
        },
        headers=faculty_auth_header,
    )
    assert create_response.status_code == 201

    request_id = create_response.get_json()["id"]
    review_response = client.patch(
        f"/api/v1/inventory/requests/{request_id}/status",
        json={"status": "approved", "reviewNotes": "Approved"},
        headers=admin_auth_header,
    )

    assert review_response.status_code == 200
    assert review_response.get_json()["status"] == "approved"


def test_authority_endpoints(admin_auth_header, client):
    templates_response = client.get("/api/v1/authority/templates", headers=admin_auth_header)
    assert templates_response.status_code == 200
    assert len(templates_response.get_json()) >= 1

    save_response = client.put(
        "/api/v1/authority/assignments",
        json=[
            {
                "staffId": "ST-201",
                "roles": ["Mathematics Teacher"],
                "roleTemplate": "Mathematics Teacher",
                "authorities": {
                    "leaveApproval": False,
                    "admissionApproval": False,
                    "staffCreation": False,
                    "studentPromotion": True,
                },
            }
        ],
        headers=admin_auth_header,
    )
    assert save_response.status_code == 200
    assert save_response.get_json()[0]["staffId"] == "ST-201"


def test_payroll_me(admin_auth_header, faculty_auth_header, client):
    admin_response = client.get("/api/v1/payroll/me/salary-slips", headers=admin_auth_header)
    faculty_response = client.get("/api/v1/payroll/me/salary-slips", headers=faculty_auth_header)

    assert admin_response.status_code == 200
    assert faculty_response.status_code == 200
    assert admin_response.get_json()[0]["staffId"] == "ST-203"
    assert faculty_response.get_json()[0]["staffId"] == "ST-201"


def test_promote_student(admin_auth_header, client, app):
    response = client.post(
        "/api/v1/administration/promotions/1",
        json={"targetClass": "Class 11", "academicYear": "2025-2026"},
        headers=admin_auth_header,
    )

    assert response.status_code == 200
    assert response.get_json()["promoted"] is True

    with app.app_context():
        promoted_class = InstituteClass.query.filter_by(name="Class 11", academic_year="2025-2026").first()
        assert promoted_class is not None
