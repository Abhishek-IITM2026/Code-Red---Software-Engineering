"""Minimal test seed for fast pytest runs."""
from ..extensions import db
from ..models import (
    AdministrationStaff,
    ClassEnrollment,
    Faculty,
    InstituteClass,
    Parent,
    Role,
    Student,
    Subject,
    UpcomingCourse,
    User,
)

TEST_USERS = [
    ("student@example.com", "Student", "Sam", "Student", "student123", "student"),
    ("faculty@example.com", "Faculty", "Prof", "Faculty", "faculty123", "faculty"),
    ("admin@example.com", "Administration Staff", "Admin", "User", "admin123", "admin"),
    ("parent@example.com", "Parent", "Par", "Ent", "parent123", "parent"),
]


def seed_test_db():
    """Create minimal test data quickly."""
    if User.query.first():
        return

    role_student = _get_or_create_role("student")
    role_faculty = _get_or_create_role("faculty")
    role_admin = _get_or_create_role("admin")
    role_parent = _get_or_create_role("parent")

    users = {}
    for email, title, first, last, pwd, role_key in TEST_USERS:
        role = {"student": role_student, "faculty": role_faculty, "admin": role_admin, "parent": role_parent}[role_key]
        user = User(
            email=email,
            title=title,
            first_name=first,
            last_name=last,
            password_hash=User.hash_password(pwd),
            status="ACTIVE",
        )
        user.roles.append(role)
        db.session.add(user)
        users[role_key] = user

    db.session.flush()

    # Create admin staff
    admin_staff = AdministrationStaff(
        user_id=users["admin"].id,
        employee_code="ADMIN-001",
        designation="System Administrator",
        department="Administration",
        joining_date="2024-01-01",
    )
    db.session.add(admin_staff)

    # Create institute class
    institute_class = InstituteClass(
        name="Class 9",
        grade="9",
        section="A",
        academic_year="2025-2026",
        max_strength=40,
    )
    db.session.add(institute_class)
    db.session.flush()

    # Create faculty
    faculty = Faculty(
        user_id=users["faculty"].id,
        subject_specialization="Mathematics",
        designation="Teacher",
        hire_date="2024-01-01",
    )
    db.session.add(faculty)

    # Create student with enrollment
    student_user = users["student"]
    student = Student(
        user_id=student_user.id,
        roll_number="STU-001",
    )
    db.session.add(student)
    db.session.flush()

    enrollment = ClassEnrollment(
        student_id=student.id,
        class_id=institute_class.id,
        academic_year="2025-2026",
    )
    db.session.add(enrollment)

    # Create parent
    parent_user = users["parent"]
    parent = Parent(user_id=parent_user.id)
    db.session.add(parent)

    # Create subject
    subject = Subject(name="Mathematics", code="MATH-9", description="Math for Class 9")
    db.session.add(subject)

    # Create upcoming course
    course = UpcomingCourse(
        title="Introduction to Algebra",
        description="Basic algebra for Class 9",
        class_id=institute_class.id,
        start_date="2026-04-01",
        end_date="2026-06-30",
        instructor="Prof. Faculty",
        mode="Offline",
        seats=30,
        created_by=users["admin"].id,
        status="active",
    )
    db.session.add(course)

    db.session.commit()


def _get_or_create_role(name: str) -> Role:
    role = Role.query.filter_by(name=name).first()
    if not role:
        role = Role(name=name)
        db.session.add(role)
        db.session.flush()
    return role
