"""Unit tests for Students Blueprint business logic."""
import pytest
from datetime import date

from app import create_app
from app.extensions import db
from app.models import Student, User, UserStatus, InstituteClass, ClassEnrollment
from app.services.query import get_current_student, get_student_subjects


@pytest.fixture(scope="module")
def app():
    """Create application for unit testing."""
    app = create_app("testing")
    with app.app_context():
        db.create_all()
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def student_user(app):
    """Create a student user for testing."""
    with app.app_context():
        # Create institute class
        institute_class = InstituteClass(
            name="Class 5",
            section="A",
            academic_year="2024-2025",
            class_teacher_id=1
        )
        db.session.add(institute_class)
        db.session.flush()

        # Create user
        user = User(
            email="student_unit@test.com",
            first_name="Unit",
            last_name="Student",
            password_hash="hash",
            status=UserStatus.ACTIVE,
            role_scope="student",
        )
        db.session.add(user)
        db.session.flush()

        # Create student
        student = Student(
            user_id=user.id,
            class_id=institute_class.id,
            roll_number="STU001",
            date_of_admission=date(2024, 1, 1),
        )
        db.session.add(student)
        db.session.flush()

        # Create enrollment
        enrollment = ClassEnrollment(
            student_id=student.id,
            class_id=institute_class.id,
            academic_year="2024-2025",
            status="active",
        )
        db.session.add(enrollment)
        db.session.commit()

        yield {
            "user": user,
            "student": student,
            "class": institute_class,
            "enrollment": enrollment,
        }

        # Cleanup
        db.session.delete(enrollment)
        db.session.delete(student)
        db.session.delete(user)
        db.session.delete(institute_class)
        db.session.commit()


class TestStudentModel:
    """Test Student model operations."""

    def test_student_creation(self, app, student_user):
        """Test student creation."""
        with app.app_context():
            student = Student.query.get(student_user["student"].id)
            assert student is not None
            assert student.roll_number == "STU001"

    def test_student_to_dict(self, app, student_user):
        """Test student serialization."""
        with app.app_context():
            student = Student.query.get(student_user["student"].id)
            data = student.to_dict()
            assert "rollNumber" in data
            assert "classId" in data
            assert data["rollNumber"] == "STU001"

    def test_current_enrollment(self, app, student_user):
        """Test getting current enrollment."""
        with app.app_context():
            student = Student.query.get(student_user["student"].id)
            enrollment = student.current_enrollment()
            assert enrollment is not None
            assert enrollment.academic_year == "2024-2025"


class TestStudentQueries:
    """Test student query functions."""

    def test_get_student_subjects(self, app, student_user):
        """Test get_student_subjects returns list."""
        with app.app_context():
            subjects = get_student_subjects(student_user["student"].id)
            assert isinstance(subjects, list)

    def test_student_by_class(self, app, student_user):
        """Test querying students by class."""
        with app.app_context():
            class_id = student_user["class"].id
            students = Student.query.join(ClassEnrollment).filter(
                ClassEnrollment.class_id == class_id
            ).all()
            assert len(students) >= 1