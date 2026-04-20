"""Unit tests for Faculty Blueprint business logic."""
import pytest
from datetime import date

from app import create_app
from app.extensions import db
from app.models import Faculty, FacultySubjectAssignment, User, UserStatus, InstituteClass, Subject


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
def faculty_data(app):
    """Create sample data for faculty testing."""
    with app.app_context():
        # Create user
        user = User(
            email="faculty_unit@test.com",
            first_name="Unit",
            last_name="Faculty",
            password_hash="hash",
            status=UserStatus.ACTIVE,
            role_scope="faculty",
        )
        db.session.add(user)
        db.session.flush()

        # Create institute class
        institute_class = InstituteClass(
            name="Class 7",
            section="A",
            academic_year="2024-2025",
            class_teacher_id=1
        )
        db.session.add(institute_class)
        db.session.flush()

        # Create faculty
        faculty = Faculty(
            user_id=user.id,
            employee_id="FAC001",
            subject_specialization="Mathematics",
            designation="Teacher",
        )
        db.session.add(faculty)
        db.session.flush()

        # Create subject
        subject = Subject(
            name="Mathematics",
            class_id=institute_class.id,
            status="active",
            course_type="core",
        )
        db.session.add(subject)
        db.session.flush()

        # Create assignment
        assignment = FacultySubjectAssignment(
            faculty_id=faculty.id,
            class_id=institute_class.id,
            subject_id=subject.id,
        )
        db.session.add(assignment)
        db.session.commit()

        yield {
            "user": user,
            "faculty": faculty,
            "class": institute_class,
            "subject": subject,
            "assignment": assignment,
        }

        # Cleanup
        db.session.delete(assignment)
        db.session.delete(subject)
        db.session.delete(faculty)
        db.session.delete(institute_class)
        db.session.delete(user)
        db.session.commit()


class TestFacultyModel:
    """Test Faculty model operations."""

    def test_faculty_creation(self, app, faculty_data):
        """Test faculty creation."""
        with app.app_context():
            faculty = Faculty.query.get(faculty_data["faculty"].id)
            assert faculty is not None
            assert faculty.employee_id == "FAC001"

    def test_faculty_to_dict(self, app, faculty_data):
        """Test faculty serialization."""
        with app.app_context():
            faculty = Faculty.query.get(faculty_data["faculty"].id)
            data = faculty.to_dict()
            assert "employeeId" in data
            assert "subjectSpecialization" in data


class TestFacultyAssignmentModel:
    """Test FacultySubjectAssignment model operations."""

    def test_assignment_creation(self, app, faculty_data):
        """Test creating a faculty subject assignment."""
        with app.app_context():
            assignment = FacultySubjectAssignment.query.get(
                faculty_data["assignment"].id
            )
            assert assignment is not None
            assert assignment.faculty_id == faculty_data["faculty"].id

    def test_assignment_to_dict(self, app, faculty_data):
        """Test assignment serialization."""
        with app.app_context():
            assignment = FacultySubjectAssignment.query.get(
                faculty_data["assignment"].id
            )
            data = assignment.to_dict()
            assert "facultyId" in data
            assert "classId" in data
            assert "subjectId" in data

    def test_get_faculty_classes(self, app, faculty_data):
        """Test getting faculty assigned classes."""
        with app.app_context():
            assignments = FacultySubjectAssignment.query.filter_by(
                faculty_id=faculty_data["faculty"].id
            ).all()
            class_ids = {a.class_id for a in assignments}
            assert faculty_data["class"].id in class_ids

    def test_get_faculty_subjects(self, app, faculty_data):
        """Test getting faculty assigned subjects."""
        with app.app_context():
            assignments = FacultySubjectAssignment.query.filter_by(
                faculty_id=faculty_data["faculty"].id
            ).all()
            subject_ids = {a.subject_id for a in assignments}
            assert faculty_data["subject"].id in subject_ids