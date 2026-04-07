from flask import g

from ..extensions import db
from ..models import Assignment, Attendance, FacultySubjectAssignment, Mark, Student


def get_current_student():
    if hasattr(g, "current_user") and g.current_user.student:
        return g.current_user.student
    return Student.query.first()


def get_student_subjects(student_id: int):
    student = db.session.get(Student, student_id)
    enrollment = student.current_enrollment() if student else None
    if not enrollment:
        return []

    assignments = FacultySubjectAssignment.query.filter_by(class_id=enrollment.class_id).all()
    subjects = []
    for assignment in assignments:
        subject = assignment.subject
        if subject is None:
            continue
        subjects.append(subject.to_dict(faculty_id=assignment.faculty_id))
    return subjects


def get_attendance_stats(student_id: int):
    records = Attendance.query.filter_by(student_id=student_id).all()
    total = len(records)
    present = len([item for item in records if item.status == "PRESENT"])
    absent = len([item for item in records if item.status == "ABSENT"])
    return {
        "total": total,
        "present": present,
        "absent": absent,
        "percentage": round((present / total) * 100, 2) if total else 0,
    }


def get_performance_summary(student_id: int):
    marks = Mark.query.filter_by(student_id=student_id).all()
    total_students = Student.query.count() or 1
    average = round(sum(mark.marks_obtained for mark in marks) / len(marks), 2) if marks else 0
    return {"average": average, "rank": 1, "totalStudents": total_students}


def get_assignments(subject_id: int | None = None, status: str | None = None):
    query = Assignment.query
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if status:
        query = query.filter_by(status=status)
    return [assignment.to_dict() for assignment in query.all()]
