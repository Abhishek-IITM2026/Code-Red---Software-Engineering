from datetime import date, datetime, timedelta, timezone

from ..extensions import db
from ..models import (
    AdministrationStaff,
    Assignment,
    Assessment,
    Attendance,
    ClassEnrollment,
    Faculty,
    FacultySubjectAssignment,
    InstituteClass,
    Mark,
    Material,
    Parent,
    Role,
    Schedule,
    Student,
    Subject,
    User,
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

    admin = User(email="admin@example.com", title="Administration Staff", first_name="Asha", last_name="Admin", phone="9999999999")
    admin.set_password("admin123")
    attach_roles(admin, roles["admin"], roles["administration"])

    director = User(email="director@example.com", title="Director", first_name="Diya", last_name="Kapoor", phone="6666666666")
    director.set_password("director123")
    attach_roles(director, roles["director"], roles["administration"])

    faculty_user = User(email="faculty@example.com", title="Mathematics Faculty", first_name="Ravi", last_name="Sharma", phone="8888888888")
    faculty_user.set_password("faculty123")
    attach_roles(faculty_user, roles["faculty"])

    student_user = User(email="student@example.com", title="Student", first_name="Neha", last_name="Patel", phone="7777777777")
    student_user.set_password("student123")
    attach_roles(student_user, roles["student"])

    parent_user = User(email="parent@example.com", title="Parent", first_name="Meera", last_name="Patel", phone="5555555555")
    parent_user.set_password("parent123")
    attach_roles(parent_user, roles["parent"])

    db.session.add_all([admin, director, faculty_user, student_user, parent_user])
    db.session.flush()

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

    db.session.commit()
