"""Unit tests for Marks Blueprint business logic."""
import pytest
from datetime import date

from app import create_app
from app.extensions import db
from app.models import Mark, Student, User, UserStatus, InstituteClass, Subject


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
def mark_data(app):
    """Create sample data for marks testing."""
    with app.app_context():
        # Create institute class
        institute_class = InstituteClass(
            name="Class 6",
            section="B",
            academic_year="2024-2025",
            class_teacher_id=1
        )
        db.session.add(institute_class)
        db.session.flush()

        # Create user
        user = User(
            email="marks_test@example.com",
            first_name="Marks",
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
            roll_number="MRK001",
            date_of_admission=date(2024, 1, 1),
        )
        db.session.add(student)
        db.session.flush()

        # Create subject
        subject = Subject(
            name="Mathematics",
            class_id=institute_class.id,
            status="active",
            course_type="core",
        )
        db.session.add(subject)
        db.session.commit()

        yield {
            "student": student,
            "subject": subject,
            "class_id": institute_class.id,
        }

        # Cleanup
        db.session.delete(subject)
        db.session.delete(student)
        db.session.delete(user)
        db.session.delete(institute_class)
        db.session.commit()


class TestMarkModel:
    """Test Mark model operations."""

    def test_mark_creation(self, app, mark_data):
        """Test creating a mark record."""
        with app.app_context():
            mark = Mark(
                student_id=mark_data["student"].id,
                subject_id=mark_data["subject"].id,
                class_id=mark_data["class_id"],
                exam_type="Unit Test",
                marks_obtained=85,
                total_marks=100,
                graded_by=1,
            )
            db.session.add(mark)
            db.session.commit()
            assert mark.id is not None
            assert mark.marks_obtained == 85
            db.session.delete(mark)
            db.session.commit()

    def test_mark_to_dict(self, app, mark_data):
        """Test mark serialization."""
        with app.app_context():
            mark = Mark(
                student_id=mark_data["student"].id,
                subject_id=mark_data["subject"].id,
                class_id=mark_data["class_id"],
                exam_type="Final Exam",
                marks_obtained=90,
                total_marks=100,
                graded_by=1,
            )
            db.session.add(mark)
            db.session.commit()
            data = mark.to_dict()
            assert "marksObtained" in data
            assert "totalMarks" in data
            db.session.delete(mark)
            db.session.commit()

    def test_mark_percentage(self, app, mark_data):
        """Test mark percentage calculation."""
        with app.app_context():
            mark = Mark(
                student_id=mark_data["student"].id,
                subject_id=mark_data["subject"].id,
                class_id=mark_data["class_id"],
                exam_type="Quiz",
                marks_obtained=45,
                total_marks=50,
                graded_by=1,
            )
            db.session.add(mark)
            db.session.commit()
            percentage = (mark.marks_obtained / mark.total_marks) * 100
            assert percentage == 90.0
            db.session.delete(mark)
            db.session.commit()


class TestMarkQueries:
    """Test mark query operations."""

    def test_filter_by_student(self, app, mark_data):
        """Test filtering marks by student."""
        with app.app_context():
            mark = Mark(
                student_id=mark_data["student"].id,
                subject_id=mark_data["subject"].id,
                class_id=mark_data["class_id"],
                exam_type="Test",
                marks_obtained=75,
                total_marks=100,
                graded_by=1,
            )
            db.session.add(mark)
            db.session.commit()

            marks = Mark.query.filter_by(student_id=mark_data["student"].id).all()
            assert len(marks) >= 1

            db.session.delete(mark)
            db.session.commit()

    def test_filter_by_exam_type(self, app, mark_data):
        """Test filtering marks by exam type."""
        with app.app_context():
            mark = Mark(
                student_id=mark_data["student"].id,
                subject_id=mark_data["subject"].id,
                class_id=mark_data["class_id"],
                exam_type="Midterm",
                marks_obtained=80,
                total_marks=100,
                graded_by=1,
            )
            db.session.add(mark)
            db.session.commit()

            marks = Mark.query.filter_by(exam_type="Midterm").all()
            assert any(m.exam_type == "Midterm" for m in marks)

            db.session.delete(mark)
            db.session.commit()