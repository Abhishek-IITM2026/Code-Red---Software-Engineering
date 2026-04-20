"""Unit tests for Attendance Blueprint business logic."""
import pytest
from datetime import date, timedelta

from app import create_app
from app.extensions import db
from app.models import Attendance, Student, InstituteClass, User, UserStatus, FacultySubjectAssignment
from app.features.attendance.routes import _save_attendance
from app.schemas import AttendanceSubmissionRequest


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
def sample_attendance_data(app):
    """Create sample data for attendance testing."""
    with app.app_context():
        # Create institute class
        institute_class = InstituteClass(
            name="Class 1",
            section="A",
            academic_year="2024-2025",
            class_teacher_id=1
        )
        db.session.add(institute_class)
        db.session.flush()

        # Create user
        user = User(
            email="attendance_test@example.com",
            first_name="Attendance",
            last_name="Test",
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
            roll_number="ATT001",
            date_of_admission=date(2024, 1, 1),
        )
        db.session.add(student)
        db.session.commit()

        yield {
            "class_id": institute_class.id,
            "student_id": student.id,
            "user_id": user.id,
        }

        # Cleanup
        db.session.delete(student)
        db.session.delete(user)
        db.session.delete(institute_class)
        db.session.commit()


class TestAttendanceModel:
    """Test Attendance model operations."""

    def test_attendance_creation(self, app, sample_attendance_data):
        """Test creating an attendance record."""
        with app.app_context():
            attendance = Attendance(
                student_id=sample_attendance_data["student_id"],
                class_id=sample_attendance_data["class_id"],
                subject_id=1,
                attendance_date=date.today(),
                marked_by=1,
                status="PRESENT",
            )
            db.session.add(attendance)
            db.session.commit()
            assert attendance.id is not None
            assert attendance.status == "PRESENT"
            db.session.delete(attendance)
            db.session.commit()

    def test_attendance_to_dict(self, app, sample_attendance_data):
        """Test attendance serialization."""
        with app.app_context():
            attendance = Attendance(
                student_id=sample_attendance_data["student_id"],
                class_id=sample_attendance_data["class_id"],
                subject_id=1,
                attendance_date=date.today(),
                marked_by=1,
                status="ABSENT",
            )
            db.session.add(attendance)
            db.session.commit()
            data = attendance.to_dict()
            assert "status" in data
            assert data["status"] == "ABSENT"
            db.session.delete(attendance)
            db.session.commit()

    def test_attendance_status_uppercase(self, app, sample_attendance_data):
        """Test that attendance status is stored uppercase."""
        with app.app_context():
            attendance = Attendance(
                student_id=sample_attendance_data["student_id"],
                class_id=sample_attendance_data["class_id"],
                subject_id=1,
                attendance_date=date.today(),
                marked_by=1,
                status="present",  # lowercase input
            )
            db.session.add(attendance)
            db.session.commit()
            assert attendance.status == "PRESENT"
            db.session.delete(attendance)
            db.session.commit()


class TestAttendanceDateFiltering:
    """Test attendance date range queries."""

    def test_filter_by_date(self, app, sample_attendance_data):
        """Test filtering attendance by specific date."""
        with app.app_context():
            today = date.today()
            attendance = Attendance(
                student_id=sample_attendance_data["student_id"],
                class_id=sample_attendance_data["class_id"],
                subject_id=1,
                attendance_date=today,
                marked_by=1,
                status="PRESENT",
            )
            db.session.add(attendance)
            db.session.commit()

            # Query by date
            results = Attendance.query.filter_by(attendance_date=today).all()
            assert len(results) >= 1

            db.session.delete(attendance)
            db.session.commit()