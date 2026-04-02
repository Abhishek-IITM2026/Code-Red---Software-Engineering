from datetime import date, datetime, timedelta, timezone

from ..extensions import db
from ..models import (
    AdministrationStaff,
    AuthorityAssignment,
    Assignment,
    Assessment,
    Attendance,
    ClassEnrollment,
    Faculty,
    FacultySubjectAssignment,
    InventoryItem,
    InstituteClass,
    Mark,
    Material,
    MaterialRequest,
    MaterialRequestItem,
    Parent,
    Role,
    SalarySlip,
    Schedule,
    Student,
    Subject,
    User,
    UserContactProfile,
)


def utc_today_plus(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).date().isoformat()


def ensure_roles():
    role_specs = [
        ("student", "Student self-service portal access"),
        ("faculty", "Faculty teaching and classroom operations access"),
        ("parent", "Parent portal access"),
        ("admin", "Administrative control access"),
        ("administration", "Administration workspace access"),
        ("director", "Director-level approvals and institute oversight"),
        ("superadmin", "Platform-level administration access"),
    ]
    role_map = {}
    for name, description in role_specs:
        role = Role.query.filter_by(name=name).first()
        if role is None:
            role = Role(name=name, description=description)
            db.session.add(role)
        role_map[name] = role
    db.session.flush()
    return role_map


def attach_roles(user: User, *roles: Role):
    for role in roles:
        if role not in user.roles:
            user.roles.append(role)


def seed_database():
    if User.query.first():
        return

    roles = ensure_roles()

    admin = User(email="admin@example.com", title="Administration Staff", first_name="Asha", last_name="Admin")
    admin.set_password("admin123")
    attach_roles(admin, roles["admin"], roles["administration"])

    director = User(email="director@example.com", title="Director", first_name="Diya", last_name="Kapoor")
    director.set_password("director123")
    attach_roles(director, roles["director"], roles["administration"])

    faculty_user = User(email="faculty@example.com", title="Mathematics Faculty", first_name="Ravi", last_name="Sharma")
    faculty_user.set_password("faculty123")
    attach_roles(faculty_user, roles["faculty"])

    student_user = User(email="student@example.com", title="Student", first_name="Neha", last_name="Patel")
    student_user.set_password("student123")
    attach_roles(student_user, roles["student"])

    parent_user = User(email="parent@example.com", title="Parent", first_name="Meera", last_name="Patel")
    parent_user.set_password("parent123")
    attach_roles(parent_user, roles["parent"])

    db.session.add_all([admin, director, faculty_user, student_user, parent_user])
    db.session.flush()

    db.session.add_all(
        [
            UserContactProfile(user_id=admin.id, phone_number="+91 99999 99999"),
            UserContactProfile(user_id=director.id, phone_number="+91 66666 66666"),
            UserContactProfile(user_id=faculty_user.id, phone_number="+91 88888 88888"),
            UserContactProfile(user_id=student_user.id, phone_number="+91 77777 77777"),
            UserContactProfile(user_id=parent_user.id, phone_number="+91 55555 55555"),
        ]
    )

    db.session.add_all(
        [
            AdministrationStaff(user_id=admin.id, department="Operations", designation="Administration Staff", employee_code="ADM-001"),
            AdministrationStaff(user_id=director.id, department="Executive", designation="Director", employee_code="DIR-001"),
        ]
    )

    faculty = Faculty(
        user_id=faculty_user.id,
        qualification="M.Sc",
        subject_specialization="Mathematics",
        hire_date=date(2022, 6, 1),
        is_class_faculty=True,
    )
    student = Student(user_id=student_user.id, admission_date=date(2024, 4, 1), roll_number="STU-001")
    db.session.add_all([faculty, student])
    db.session.flush()

    db.session.add(Parent(user_id=parent_user.id, student_id=student.id, relation="Mother", is_primary=True))

    class_10 = InstituteClass(name="Class 10", grade="10", section="A", academic_year="2025-2026", class_faculty_id=faculty.id, room_number="101")
    class_9 = InstituteClass(name="Class 9", grade="9", section="B", academic_year="2025-2026", room_number="102")
    db.session.add_all([class_10, class_9])
    db.session.flush()

    db.session.add(ClassEnrollment(student_id=student.id, class_id=class_10.id, academic_year="2025-2026"))

    math = Subject(name="Mathematics", code="MATH-10", description="Core mathematics")
    physics = Subject(name="Physics", code="PHY-10", description="Physics fundamentals")
    db.session.add_all([math, physics])
    db.session.flush()

    db.session.add_all(
        [
            FacultySubjectAssignment(faculty_id=faculty.id, subject_id=math.id, class_id=class_10.id, academic_year="2025-2026"),
            FacultySubjectAssignment(faculty_id=faculty.id, subject_id=physics.id, class_id=class_10.id, academic_year="2025-2026"),
        ]
    )

    db.session.add_all(
        [
            Attendance(student_id=student.id, class_id=class_10.id, subject_id=math.id, attendance_date=date.today(), status="PRESENT", marked_by=faculty_user.id),
            Attendance(student_id=student.id, class_id=class_10.id, subject_id=physics.id, attendance_date=date.today() - timedelta(days=1), status="ABSENT", marked_by=faculty_user.id),
        ]
    )

    db.session.add_all(
        [
            Mark(examination_name="Unit Test 1", exam_type="UNIT_TEST", student_id=student.id, subject_id=math.id, marks_obtained=88, total_marks=100, entered_by=faculty_user.id, exam_date=date.today() - timedelta(days=10)),
            Mark(examination_name="Mid Term", exam_type="MID_TERM", student_id=student.id, subject_id=physics.id, marks_obtained=76, total_marks=100, entered_by=faculty_user.id, exam_date=date.today() - timedelta(days=5)),
        ]
    )

    db.session.add_all(
        [
            Schedule(class_id=class_10.id, subject_id=math.id, faculty_id=faculty.id, day_of_week=1, start_time="09:00", end_time="10:00", room_number="101", academic_year="2025-2026"),
            Schedule(class_id=class_10.id, subject_id=physics.id, faculty_id=faculty.id, day_of_week=3, start_time="10:00", end_time="11:00", room_number="101", academic_year="2025-2026"),
        ]
    )

    db.session.add_all(
        [
            Material(subject_id=math.id, title="Algebra Fundamentals", unit="Unit 1", week="Week 1", material_type="Notes", description="Expressions and equations"),
            Material(subject_id=physics.id, title="Laws of Motion", unit="Unit 1", week="Week 2", material_type="Slides", description="Newton's laws"),
        ]
    )

    db.session.add(
        Assessment(
            title="Algebra Quiz",
            description="Quiz on algebra basics",
            class_id=class_10.id,
            subject_id=math.id,
            due_date=utc_today_plus(7),
            total_marks=20,
            created_by=faculty_user.id,
            published=False,
            questions_json=[
                {"id": "q1", "questionText": "Solve x + 5 = 9", "questionType": "short", "marks": 5, "difficulty": "easy"},
                {"id": "q2", "questionText": "Choose the algebraic expression", "questionType": "mcq", "options": ["2+2", "x+2", "5"], "correctAnswer": "x+2", "marks": 5, "difficulty": "easy"},
            ],
        )
    )

    db.session.add_all(
        [
            Assignment(subject_id=math.id, title="Worksheet 1", description="Algebra practice", due_date=utc_today_plus(5), total_marks=25, status="open"),
            Assignment(subject_id=physics.id, title="Lab Reflection", description="Motion lab summary", due_date=utc_today_plus(3), total_marks=20, status="open"),
        ]
    )

    inventory_items = [
        InventoryItem(
            name="White Board Marker",
            category="stationery",
            quantity=150,
            available=120,
            reserved=30,
            unit="piece",
            min_stock=20,
            price=25,
            supplier="Stationery Co",
            location="Store Room A",
        ),
        InventoryItem(
            name="A4 Paper Ream",
            category="stationery",
            quantity=200,
            available=180,
            reserved=20,
            unit="ream",
            min_stock=30,
            price=350,
            supplier="Paper Mart",
            location="Store Room B",
        ),
        InventoryItem(
            name="Projector",
            category="electronics",
            quantity=10,
            available=8,
            reserved=2,
            unit="piece",
            min_stock=2,
            price=15000,
            supplier="Tech Solutions",
            location="Equipment Room",
        ),
    ]
    db.session.add_all(inventory_items)
    db.session.flush()

    request_one = MaterialRequest(faculty_id=faculty.id, department="Mathematics", status="pending")
    request_two = MaterialRequest(
        faculty_id=faculty.id,
        department="Mathematics",
        status="approved",
        review_notes="Approved for this week.",
        reviewed_by=admin.id,
    )
    db.session.add_all([request_one, request_two])
    db.session.flush()
    db.session.add_all(
        [
            MaterialRequestItem(request_id=request_one.id, item_id=inventory_items[0].id, quantity=5),
            MaterialRequestItem(request_id=request_one.id, item_id=inventory_items[1].id, quantity=2),
            MaterialRequestItem(request_id=request_two.id, item_id=inventory_items[2].id, quantity=1),
        ]
    )

    db.session.add_all(
        [
            AuthorityAssignment(
                user_id=faculty_user.id,
                roles_json=["Mathematics Teacher"],
                role_template="Mathematics Teacher",
                authorities_json={
                    "leaveApproval": False,
                    "admissionApproval": False,
                    "staffCreation": False,
                    "studentPromotion": True,
                    "scheduleCreation": True,
                },
                updated_by="System",
            ),
            AuthorityAssignment(
                user_id=admin.id,
                roles_json=["Administration Staff"],
                role_template="Administration Staff",
                authorities_json={
                    "leaveApproval": False,
                    "admissionApproval": True,
                    "staffCreation": True,
                    "studentPromotion": False,
                    "scheduleCreation": False,
                },
                updated_by="System",
            ),
        ]
    )

    db.session.add_all(
        [
            SalarySlip(
                staff_id="ST-201",
                staff_name="Ravi Sharma",
                employee_code="EMP-010",
                role="Mathematics Teacher",
                department="Mathematics",
                category="Teaching",
                bank_account="XXXXXX4821",
                year="2026",
                month_key="2026-03",
                month_label="March 2026",
                working_days=26,
                payable_days=26,
                paid_leave_days=2,
                unpaid_leave_days=0,
                overtime_hours=8,
                overtime_rate=350,
                payment_mode="Bank Transfer",
                generated_on="2026-03-31",
                payout_status="Pending",
                base_salary=58000,
                allowances_json=[
                    {"label": "Basic Pay", "amount": 41000},
                    {"label": "Academic Allowance", "amount": 7000},
                    {"label": "Performance Bonus", "amount": 5000},
                    {"label": "Transport Allowance", "amount": 5000},
                ],
                overtime_amount=2800,
                unpaid_leave_deduction=0,
                gross_salary=60800,
                total_deductions=0,
                net_salary=60800,
            ),
            SalarySlip(
                staff_id="ST-203",
                staff_name="Asha Admin",
                employee_code="ADM-001",
                role="Administration Staff",
                department="Operations",
                category="Non-Teaching",
                bank_account="XXXXXX6845",
                year="2026",
                month_key="2026-03",
                month_label="March 2026",
                working_days=26,
                payable_days=25,
                paid_leave_days=0,
                unpaid_leave_days=1,
                overtime_hours=4,
                overtime_rate=250,
                payment_mode="Bank Transfer",
                generated_on="2026-03-31",
                payout_status="Pending",
                base_salary=46000,
                allowances_json=[
                    {"label": "Basic Pay", "amount": 34000},
                    {"label": "Operations Allowance", "amount": 6000},
                    {"label": "Transport Allowance", "amount": 3000},
                ],
                overtime_amount=1000,
                unpaid_leave_deduction=1769.23,
                gross_salary=47000,
                total_deductions=1769.23,
                net_salary=45230.77,
            ),
        ]
    )

    db.session.commit()
