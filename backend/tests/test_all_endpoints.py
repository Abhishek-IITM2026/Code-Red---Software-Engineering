from datetime import date


def _verified_otp_payload(client, email: str, purpose: str):
    send_response = client.post("/api/v1/auth/otp/send", json={"email": email, "purpose": purpose})
    assert send_response.status_code == 200
    otp = send_response.get_json()["otp"]

    verify_response = client.post(
        "/api/v1/auth/otp/verify",
        json={"email": email, "purpose": purpose, "otp": otp},
    )
    assert verify_response.status_code == 200


def _create_assessment(client, faculty_auth_header):
    response = client.post(
        "/api/v1/assessments",
        json={
            "title": "Endpoint Coverage Assessment",
            "description": "Coverage test",
            "classId": 1,
            "subjectId": 1,
            "questions": [
                {
                    "id": "q-1",
                    "questionText": "What is algebra?",
                    "questionType": "short",
                    "marks": 5,
                    "difficulty": "easy",
                }
            ],
            "totalMarks": 5,
            "createdBy": 1,
            "dueDate": "2026-04-20",
            "published": False,
        },
        headers=faculty_auth_header,
    )
    assert response.status_code == 201
    return response.get_json()["id"]


def _create_inventory_item(client, admin_auth_header):
    response = client.post(
        "/api/v1/inventory/items",
        json={
            "name": "Coverage Pen",
            "category": "stationery",
            "quantity": 20,
            "available": 20,
            "reserved": 0,
            "unit": "piece",
            "minStock": 5,
            "price": 10,
            "supplier": "Coverage Supplier",
            "location": "Coverage Shelf",
        },
        headers=admin_auth_header,
    )
    assert response.status_code == 201
    return response.get_json()["id"]


def _create_material_request(client, faculty_auth_header):
    response = client.post(
        "/api/v1/inventory/requests",
        json={
            "department": "Mathematics",
            "items": [{"itemId": 1, "quantity": 2}],
        },
        headers=faculty_auth_header,
    )
    assert response.status_code == 201
    return response.get_json()["id"]


def test_health_endpoint(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_auth_endpoints(client, student_auth_header):
    login_response = client.post("/api/v1/auth/login", json={"email": "student@example.com", "password": "student123"})
    assert login_response.status_code == 200
    token = login_response.get_json()["token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "endpoint-user@example.com",
            "password": "secret123",
            "firstName": "Endpoint",
            "lastName": "User",
            "role": "student",
        },
    )
    assert register_response.status_code == 201

    logout_response = client.post("/api/v1/auth/logout")
    assert logout_response.status_code == 200

    me_response = client.get("/api/v1/auth/me", headers=auth_header)
    assert me_response.status_code == 200

    refresh_response = client.post("/api/v1/auth/refresh", headers=auth_header)
    assert refresh_response.status_code == 200

    _verified_otp_payload(client, "student@example.com", "profile_update")
    profile_response = client.post(
        "/api/v1/auth/profile/update",
        json={"firstName": "Neha", "lastName": "Patel", "phone": "+91 70000 00001"},
        headers=student_auth_header,
    )
    assert profile_response.status_code == 200
    assert profile_response.get_json()["user"]["phone"] == "+91 70000 00001"

    _verified_otp_payload(client, "student@example.com", "profile_picture_update")
    picture_response = client.post(
        "/api/v1/auth/profile/picture",
        json={"profilePicture": "https://example.com/student.png"},
        headers=student_auth_header,
    )
    assert picture_response.status_code == 200

    _verified_otp_payload(client, "student@example.com", "password_change")
    password_response = client.post(
        "/api/v1/auth/profile/change-password",
        json={
            "currentPassword": "student123",
            "newPassword": "student1234",
            "confirmPassword": "student1234",
        },
        headers=student_auth_header,
    )
    assert password_response.status_code == 200


def test_students_endpoints(student_auth_header, faculty_auth_header, admin_auth_header, client):
    list_response = client.get("/api/v1/students", headers=admin_auth_header)
    assert list_response.status_code == 200

    filtered_response = client.get("/api/v1/students?class=1&section=A", headers=faculty_auth_header)
    assert filtered_response.status_code == 200

    detail_response = client.get("/api/v1/students/1", headers=faculty_auth_header)
    assert detail_response.status_code == 200

    me_response = client.get("/api/v1/students/me", headers=student_auth_header)
    assert me_response.status_code == 200

    subjects_response = client.get("/api/v1/students/me/subjects", headers=student_auth_header)
    assert subjects_response.status_code == 200

    content_response = client.get("/api/v1/students/me/subjects/1/content", headers=student_auth_header)
    assert content_response.status_code == 200

    performance_response = client.get("/api/v1/students/me/performance", headers=student_auth_header)
    assert performance_response.status_code == 200


def test_academics_endpoints(student_auth_header, client):
    classes_response = client.get("/api/v1/classes", headers=student_auth_header)
    assert classes_response.status_code == 200

    sections_response = client.get("/api/v1/classes/1/sections", headers=student_auth_header)
    assert sections_response.status_code == 200


def test_attendance_endpoints(student_auth_header, faculty_auth_header, client):
    list_response = client.get(
        f"/api/v1/attendance?studentId=1&subjectId=1&date={date.today().isoformat()}&class=1&section=A",
        headers=faculty_auth_header,
    )
    assert list_response.status_code == 200

    create_response = client.post(
        "/api/v1/attendance",
        json={
            "date": date.today().isoformat(),
            "class": 1,
            "section": "A",
            "records": [{"studentId": 1, "subjectId": 1, "status": "present"}],
        },
        headers=faculty_auth_header,
    )
    assert create_response.status_code == 201

    update_response = client.put(
        "/api/v1/attendance",
        json={
            "date": date.today().isoformat(),
            "class": 1,
            "section": "A",
            "records": [{"studentId": 1, "subjectId": 1, "status": "late"}],
        },
        headers=faculty_auth_header,
    )
    assert update_response.status_code == 200

    stats_response = client.get("/api/v1/attendance/me/stats", headers=student_auth_header)
    assert stats_response.status_code == 200


def test_marks_endpoints(student_auth_header, faculty_auth_header, client):
    student_response = client.get("/api/v1/marks", headers=student_auth_header)
    assert student_response.status_code == 200

    filtered_response = client.get("/api/v1/marks?studentId=1&subjectId=1&examType=UNIT_TEST", headers=faculty_auth_header)
    assert filtered_response.status_code == 200


def test_schedule_endpoints(student_auth_header, admin_auth_header, faculty_auth_header, parent_auth_header, client):
    list_response = client.get("/api/v1/schedule?classId=1&sectionId=A", headers=student_auth_header)
    assert list_response.status_code == 200

    faculty_filter_response = client.get("/api/v1/schedule?facultyId=1", headers=faculty_auth_header)
    assert faculty_filter_response.status_code == 200

    parent_response = client.get("/api/v1/schedule", headers=parent_auth_header)
    assert parent_response.status_code == 200

    create_response = client.post(
        "/api/v1/schedule",
        json={
            "classId": 1,
            "subjectId": 1,
            "facultyId": 1,
            "dayOfWeek": 4,
            "timeSlot": {"startTime": "12:00", "endTime": "13:00"},
            "roomNumber": "202",
        },
        headers=admin_auth_header,
    )
    assert create_response.status_code == 201
    schedule_id = create_response.get_json()["id"]

    update_response = client.put(
        f"/api/v1/schedule/{schedule_id}",
        json={
            "classId": 1,
            "subjectId": 1,
            "facultyId": 1,
            "dayOfWeek": 5,
            "timeSlot": {"startTime": "13:00", "endTime": "14:00"},
            "roomNumber": "203",
        },
        headers=admin_auth_header,
    )
    assert update_response.status_code == 200

    my_response = client.get("/api/v1/schedule/me", headers=student_auth_header)
    assert my_response.status_code == 200

    delete_response = client.delete(f"/api/v1/schedule/{schedule_id}", headers=admin_auth_header)
    assert delete_response.status_code == 204


def test_faculty_endpoints(faculty_auth_header, admin_auth_header, client):
    list_response = client.get("/api/v1/faculty", headers=faculty_auth_header)
    assert list_response.status_code == 200

    classes_response = client.get("/api/v1/faculty/classes", headers=faculty_auth_header)
    assert classes_response.status_code == 200

    subjects_response = client.get("/api/v1/faculty/classes/1/subjects", headers=faculty_auth_header)
    assert subjects_response.status_code == 200

    materials_response = client.get("/api/v1/faculty/subjects/1/materials", headers=faculty_auth_header)
    assert materials_response.status_code == 200

    publish_response = client.post(
        "/api/v1/faculty/subjects/1/materials",
        json={
            "title": "Coverage Material",
            "unit": "Unit 3",
            "week": "Week 4",
            "type": "Notes",
            "description": "Added by endpoint coverage test",
        },
        headers=admin_auth_header,
    )
    assert publish_response.status_code == 201


def test_inventory_endpoints(faculty_auth_header, admin_auth_header, client):
    list_items_response = client.get("/api/v1/inventory/items", headers=faculty_auth_header)
    assert list_items_response.status_code == 200

    item_id = _create_inventory_item(client, admin_auth_header)

    update_item_response = client.put(
        f"/api/v1/inventory/items/{item_id}",
        json={"available": 18, "reserved": 2, "minStock": 4},
        headers=admin_auth_header,
    )
    assert update_item_response.status_code == 200

    list_requests_response = client.get("/api/v1/inventory/requests?status=pending", headers=admin_auth_header)
    assert list_requests_response.status_code == 200

    request_id = _create_material_request(client, faculty_auth_header)

    request_filter_response = client.get("/api/v1/inventory/requests?facultyId=1", headers=faculty_auth_header)
    assert request_filter_response.status_code == 200

    patch_request_response = client.patch(
        f"/api/v1/inventory/requests/{request_id}/status",
        json={"status": "fulfilled", "reviewNotes": "Delivered"},
        headers=admin_auth_header,
    )
    assert patch_request_response.status_code == 200

    delete_item_response = client.delete(f"/api/v1/inventory/items/{item_id}", headers=admin_auth_header)
    assert delete_item_response.status_code == 204


def test_authority_endpoints(admin_auth_header, client):
    list_response = client.get("/api/v1/authority/assignments", headers=admin_auth_header)
    assert list_response.status_code == 200

    templates_response = client.get("/api/v1/authority/templates", headers=admin_auth_header)
    assert templates_response.status_code == 200

    replace_response = client.put(
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
            },
            {
                "staffId": "ST-203",
                "roles": ["Accountant"],
                "roleTemplate": "Accountant",
                "authorities": {
                    "leaveApproval": False,
                    "admissionApproval": True,
                    "staffCreation": False,
                    "studentPromotion": False,
                },
            },
        ],
        headers=admin_auth_header,
    )
    assert replace_response.status_code == 200


def test_administration_endpoints(admin_auth_header, client):
    staff_response = client.get("/api/v1/administration/staff", headers=admin_auth_header)
    assert staff_response.status_code == 200

    candidates_response = client.get("/api/v1/administration/promotions/candidates", headers=admin_auth_header)
    assert candidates_response.status_code == 200

    filtered_candidates_response = client.get(
        "/api/v1/administration/promotions/candidates?targetClass=Class 11",
        headers=admin_auth_header,
    )
    assert filtered_candidates_response.status_code == 200

    promote_response = client.post(
        "/api/v1/administration/promotions/1",
        json={"targetClass": "Class 11", "academicYear": "2025-2026"},
        headers=admin_auth_header,
    )
    assert promote_response.status_code == 200


def test_payroll_endpoints(admin_auth_header, faculty_auth_header, client):
    list_response = client.get("/api/v1/payroll/salary-slips?year=2026&monthKey=2026-03", headers=admin_auth_header)
    assert list_response.status_code == 200

    filtered_staff_response = client.get("/api/v1/payroll/salary-slips?staffId=ST-201", headers=faculty_auth_header)
    assert filtered_staff_response.status_code == 200

    my_admin_response = client.get("/api/v1/payroll/me/salary-slips?year=2026", headers=admin_auth_header)
    assert my_admin_response.status_code == 200

    my_faculty_response = client.get("/api/v1/payroll/me/salary-slips?year=2026", headers=faculty_auth_header)
    assert my_faculty_response.status_code == 200


def test_assessment_and_assignment_endpoints(student_auth_header, faculty_auth_header, admin_auth_header, client):
    generate_response = client.post(
        "/api/v1/ai/generate-questions",
        json={"subjectId": 1, "questionCount": 2, "totalMarks": 10, "difficultyLevel": "medium"},
        headers=faculty_auth_header,
    )
    assert generate_response.status_code == 200

    modify_response = client.post(
        "/api/v1/ai/modify-questions",
        json={
            "modificationPrompt": "make these harder",
            "questions": [
                {
                    "id": "q-1",
                    "questionText": "Sample question",
                    "questionType": "short",
                    "marks": 5,
                    "difficulty": "easy",
                }
            ],
        },
        headers=faculty_auth_header,
    )
    assert modify_response.status_code == 200

    list_assessments_response = client.get("/api/v1/assessments?classId=1&subjectId=1", headers=faculty_auth_header)
    assert list_assessments_response.status_code == 200

    assessment_id = _create_assessment(client, faculty_auth_header)

    get_assessment_response = client.get(f"/api/v1/assessments/{assessment_id}", headers=faculty_auth_header)
    assert get_assessment_response.status_code == 200

    patch_assessment_response = client.patch(
        f"/api/v1/assessments/{assessment_id}",
        json={"title": "Updated Endpoint Assessment", "published": True},
        headers=faculty_auth_header,
    )
    assert patch_assessment_response.status_code == 200

    publish_response = client.post(f"/api/v1/assessments/{assessment_id}/publish", headers=admin_auth_header)
    assert publish_response.status_code == 200

    list_assignments_response = client.get("/api/v1/assignments?subjectId=1&status=open", headers=student_auth_header)
    assert list_assignments_response.status_code == 200

    submit_assignment_response = client.post(
        "/api/v1/assignments/1/submit",
        json={"submissionUrl": "https://example.com/submission.pdf"},
        headers=student_auth_header,
    )
    assert submit_assignment_response.status_code == 201

    delete_assessment_response = client.delete(f"/api/v1/assessments/{assessment_id}", headers=faculty_auth_header)
    assert delete_assessment_response.status_code == 204


def test_notification_and_jobs_endpoints(admin_auth_header, faculty_auth_header, client):
    notification_response = client.post(
        "/api/v1/notifications/schedule",
        json={"message": "Coverage notification", "recipientScope": "faculty"},
        headers=admin_auth_header,
    )
    assert notification_response.status_code == 202
    task_id = notification_response.get_json()["taskId"]

    job_response = client.get(f"/api/v1/jobs/{task_id}", headers=faculty_auth_header)
    assert job_response.status_code == 200


def test_parent_endpoints(parent_auth_header, client):
    children_response = client.get("/api/v1/parent/children", headers=parent_auth_header)
    assert children_response.status_code == 200

    child_response = client.get("/api/v1/parent/children/1", headers=parent_auth_header)
    assert child_response.status_code == 200

    dashboard_response = client.get("/api/v1/parent/children/1/dashboard", headers=parent_auth_header)
    assert dashboard_response.status_code == 200

    attendance_response = client.get("/api/v1/parent/children/1/attendance", headers=parent_auth_header)
    assert attendance_response.status_code == 200

    performance_response = client.get("/api/v1/parent/children/1/performance", headers=parent_auth_header)
    assert performance_response.status_code == 200
