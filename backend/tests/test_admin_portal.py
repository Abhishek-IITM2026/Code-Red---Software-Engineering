from app.models import AdministrationStaff, AuthorityAssignment, ClassEnrollment, FacultySubjectAssignment, InventoryItem, StaffFinancialProfile, Student, UpcomingCourse, User


def test_admin_student_crud_round_trip(admin_auth_header, client, app):
    create_response = client.post(
        "/api/v1/administration/students",
        json={
            "email": "portal-student@example.com",
            "firstName": "Portal",
            "lastName": "Student",
            "class": "Class 10",
            "section": "A",
            "enrollmentNo": "PORTAL-1001",
            "phone": "+91 99999 10001",
            "guardianName": "Priya Student",
            "status": "active",
        },
        headers=admin_auth_header,
    )

    assert create_response.status_code == 201
    created_student = create_response.get_json()
    student_id = created_student["id"]
    assert created_student["guardianName"] == "Priya Student"

    update_response = client.put(
        f"/api/v1/administration/students/{student_id}",
        json={
            "email": "portal-student@example.com",
            "firstName": "Portal",
            "lastName": "Student Updated",
            "class": "Class 11",
            "section": "B",
            "enrollmentNo": "PORTAL-1001",
            "phone": "+91 99999 10002",
            "guardianName": "Priya Student",
            "status": "inactive",
        },
        headers=admin_auth_header,
    )

    assert update_response.status_code == 200
    assert update_response.get_json()["class"] == "Class 11"
    assert update_response.get_json()["status"] == "inactive"

    status_response = client.patch(
        f"/api/v1/administration/students/{student_id}/status",
        json={"status": "suspended"},
        headers=admin_auth_header,
    )

    assert status_response.status_code == 200
    assert status_response.get_json()["status"] == "suspended"

    delete_response = client.delete(
        f"/api/v1/administration/students/{student_id}",
        headers=admin_auth_header,
    )
    assert delete_response.status_code == 200

    with app.app_context():
        assert Student.query.get(int(student_id)) is None
        assert User.query.filter_by(email="portal-student@example.com").first() is None


def test_admin_staff_crud_and_employee_code_validation(admin_auth_header, client, app):
    create_response = client.post(
        "/api/v1/administration/staff",
        json={
            "email": "portal-staff@example.com",
            "firstName": "Portal",
            "lastName": "Staff",
            "employeeCode": "PORTAL-EMP-1",
            "category": "Non-Teaching",
            "designation": "Operations Officer",
            "department": "Operations",
            "phone": "+91 99999 20001",
            "joiningDate": "2026-04-01",
            "status": "active",
        },
        headers=admin_auth_header,
    )

    assert create_response.status_code == 201
    created_staff = create_response.get_json()
    staff_user_id = created_staff["id"]

    with app.app_context():
        financial_profile = StaffFinancialProfile.query.filter_by(user_id=int(staff_user_id)).first()
        assert financial_profile is not None

    duplicate_code_response = client.post(
        "/api/v1/administration/staff",
        json={
            "email": "portal-staff-duplicate@example.com",
            "firstName": "Portal",
            "lastName": "Duplicate",
            "employeeCode": "PORTAL-EMP-1",
            "category": "Non-Teaching",
            "designation": "Operations Officer",
            "department": "Operations",
            "phone": "+91 99999 20002",
            "joiningDate": "2026-04-02",
            "status": "active",
        },
        headers=admin_auth_header,
    )

    assert duplicate_code_response.status_code == 409

    update_response = client.put(
        f"/api/v1/administration/staff/{staff_user_id}",
        json={
            "email": "portal-staff@example.com",
            "firstName": "Portal",
            "lastName": "Faculty",
            "employeeCode": "PORTAL-EMP-1",
            "category": "Teaching",
            "designation": "Mathematics Teacher",
            "department": "Mathematics",
            "phone": "+91 99999 20003",
            "joiningDate": "2026-04-03",
            "status": "active",
        },
        headers=admin_auth_header,
    )

    assert update_response.status_code == 200
    assert update_response.get_json()["category"] == "Teaching"

    status_response = client.patch(
        f"/api/v1/administration/staff/{staff_user_id}/status",
        json={"status": "inactive"},
        headers=admin_auth_header,
    )

    assert status_response.status_code == 200
    assert status_response.get_json()["status"] == "inactive"

    delete_response = client.delete(
        f"/api/v1/administration/staff/{staff_user_id}",
        headers=admin_auth_header,
    )
    assert delete_response.status_code == 200

    with app.app_context():
        assert User.query.get(int(staff_user_id)) is None
        assert AdministrationStaff.query.filter_by(employee_code="PORTAL-EMP-1").first() is None
        assert AuthorityAssignment.query.filter_by(user_id=int(staff_user_id)).first() is None


def test_admin_can_delete_seeded_teaching_staff_with_subject_assignments(admin_auth_header, client, app):
    staff_response = client.get("/api/v1/administration/staff", headers=admin_auth_header)
    assert staff_response.status_code == 200
    teaching_staff = next(item for item in staff_response.get_json() if item["category"] == "Teaching")
    staff_user_id = int(teaching_staff["id"])

    with app.app_context():
        faculty_id = User.query.get(staff_user_id).faculty.id
        assignments_before = FacultySubjectAssignment.query.filter_by(faculty_id=faculty_id).all()
        assert assignments_before

    delete_response = client.delete(
        f"/api/v1/administration/staff/{staff_user_id}",
        headers=admin_auth_header,
    )
    assert delete_response.status_code == 200

    with app.app_context():
        assert User.query.get(staff_user_id) is None
        assert FacultySubjectAssignment.query.filter_by(faculty_id=faculty_id).count() == 0


def test_admin_course_validation_and_lifecycle(admin_auth_header, client, app):
    invalid_response = client.post(
        "/api/v1/administration/courses",
        json={
            "title": "Invalid Course",
            "description": "Invalid because end date is before start date.",
            "className": "Class 10",
            "section": "A",
            "startDate": "2026-04-10",
            "endDate": "2026-04-01",
            "instructor": "Ravi Sharma",
            "mode": "Offline",
            "seats": 25,
            "status": "active",
        },
        headers=admin_auth_header,
    )

    assert invalid_response.status_code == 422

    create_response = client.post(
        "/api/v1/administration/courses",
        json={
            "title": "Admin Portal Course",
            "description": "Lifecycle coverage for the admin portal.",
            "className": "Class 10",
            "section": "A",
            "startDate": "2026-04-10",
            "endDate": "2026-04-20",
            "instructor": "Ravi Sharma",
            "mode": "Hybrid",
            "seats": 25,
            "status": "active",
        },
        headers=admin_auth_header,
    )

    assert create_response.status_code == 201
    course_id = create_response.get_json()["id"]

    update_response = client.put(
        f"/api/v1/administration/courses/{course_id}",
        json={
            "title": "Admin Portal Course Updated",
            "description": "Updated course payload.",
            "className": "Class 11",
            "section": "B",
            "startDate": "2026-04-12",
            "endDate": "2026-04-22",
            "instructor": "Ravi Sharma",
            "mode": "Online",
            "seats": 30,
            "status": "inactive",
        },
        headers=admin_auth_header,
    )

    assert update_response.status_code == 200
    assert update_response.get_json()["className"] == "Class 11"
    assert update_response.get_json()["status"] == "inactive"

    delete_response = client.delete(
        f"/api/v1/administration/courses/{course_id}",
        headers=admin_auth_header,
    )
    assert delete_response.status_code == 200

    with app.app_context():
        assert UpcomingCourse.query.get(int(course_id)) is None


def test_admin_financial_record_round_trip(admin_auth_header, client, app):
    list_response = client.get("/api/v1/administration/financial-records", headers=admin_auth_header)
    assert list_response.status_code == 200
    records = list_response.get_json()
    assert records

    record = next(item for item in records if item["salaryHistory"])
    record_id = record["id"]
    detail_response = client.get(f"/api/v1/administration/financial-records/{record_id}", headers=admin_auth_header)
    assert detail_response.status_code == 200

    update_response = client.put(
        f"/api/v1/administration/financial-records/{record_id}",
        json={
            "basePay": "Rs. 52,000",
            "currentSalary": "Rs. 72,500",
            "lastIncrement": "Rs. 4,500",
            "nextReview": "2026-09-01",
            "bankAccount": "XXXXXX9999",
            "earningsBreakdown": [
                {"label": "Academic Allowance", "amount": "Rs. 10,000"},
                {"label": "Transport Allowance", "amount": "Rs. 10,500"},
            ],
        },
        headers=admin_auth_header,
    )

    assert update_response.status_code == 200
    updated = update_response.get_json()
    assert updated["basePay"] == "Rs. 52,000"
    assert updated["currentSalary"] == "Rs. 72,500"
    assert updated["lastIncrement"] == "Rs. 4,500"
    assert updated["nextReview"] == "2026-09-01"
    assert updated["bankAccount"] == "XXXXXX9999"

    payroll_response = client.get("/api/v1/payroll/salary-slips", headers=admin_auth_header)
    assert payroll_response.status_code == 200
    employee_slips = [
        slip for slip in payroll_response.get_json() if slip["employeeCode"] == updated["employeeCode"]
    ]
    assert employee_slips
    assert employee_slips[0]["baseSalary"] == 52000
    assert employee_slips[0]["allowances"][0]["amount"] == 10000
    assert employee_slips[0]["bankAccount"] == "XXXXXX9999"

    with app.app_context():
        profile = StaffFinancialProfile.query.filter_by(user_id=int(record_id)).first()
        assert profile is not None
        assert profile.base_pay == 52000
        assert profile.current_salary == 72500
        assert profile.last_increment == 4500


def test_inventory_request_transitions_are_guarded(faculty_auth_header, admin_auth_header, client, app):
    create_item_response = client.post(
        "/api/v1/inventory/items",
        json={
            "name": "Transition Coverage Item",
            "category": "stationery",
            "quantity": 5,
            "available": 1,
            "reserved": 0,
            "unit": "piece",
            "minStock": 1,
            "price": 20,
            "supplier": "Coverage Supplier",
            "location": "Shelf A",
        },
        headers=admin_auth_header,
    )
    assert create_item_response.status_code == 201
    item_id = create_item_response.get_json()["id"]

    request_response = client.post(
        "/api/v1/inventory/requests",
        json={
            "department": "Mathematics",
            "items": [{"itemId": int(item_id), "quantity": 2}],
        },
        headers=faculty_auth_header,
    )
    assert request_response.status_code == 201
    request_id = request_response.get_json()["id"]

    insufficient_response = client.patch(
        f"/api/v1/inventory/requests/{request_id}/status",
        json={"status": "approved", "reviewNotes": "Check stock"},
        headers=admin_auth_header,
    )
    assert insufficient_response.status_code == 409

    update_item_response = client.put(
        f"/api/v1/inventory/items/{item_id}",
        json={"available": 5, "quantity": 5},
        headers=admin_auth_header,
    )
    assert update_item_response.status_code == 200

    approve_response = client.patch(
        f"/api/v1/inventory/requests/{request_id}/status",
        json={"status": "approved", "reviewNotes": "Approved"},
        headers=admin_auth_header,
    )
    assert approve_response.status_code == 200

    repeat_approve_response = client.patch(
        f"/api/v1/inventory/requests/{request_id}/status",
        json={"status": "approved", "reviewNotes": "Approved again"},
        headers=admin_auth_header,
    )
    assert repeat_approve_response.status_code == 200

    fulfill_response = client.patch(
        f"/api/v1/inventory/requests/{request_id}/status",
        json={"status": "fulfilled", "reviewNotes": "Delivered"},
        headers=admin_auth_header,
    )
    assert fulfill_response.status_code == 200

    repeat_fulfill_response = client.patch(
        f"/api/v1/inventory/requests/{request_id}/status",
        json={"status": "fulfilled", "reviewNotes": "Delivered twice"},
        headers=admin_auth_header,
    )
    assert repeat_fulfill_response.status_code == 200

    with app.app_context():
        item = InventoryItem.query.get(int(item_id))
        assert item is not None
        assert item.available == 3
        assert item.reserved == 0
        assert item.quantity == 3


def test_promotion_duplicate_guard(admin_auth_header, client, app):
    first_response = client.post(
        "/api/v1/administration/promotions/1",
        json={"targetClass": "Class 11", "academicYear": "2026-2027"},
        headers=admin_auth_header,
    )
    assert first_response.status_code == 200

    duplicate_response = client.post(
        "/api/v1/administration/promotions/1",
        json={"targetClass": "Class 11", "academicYear": "2026-2027"},
        headers=admin_auth_header,
    )
    assert duplicate_response.status_code == 409

    with app.app_context():
        enrollments = ClassEnrollment.query.filter_by(student_id=1, academic_year="2026-2027").all()
        assert len(enrollments) == 1
