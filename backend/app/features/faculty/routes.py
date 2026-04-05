from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import ClassEnrollment, Faculty, FacultySubjectAssignment, Mark, Material, Student, Subject, UpcomingCourse
from ...schemas import MaterialCreateRequest, parse_json
from ...services.query import get_attendance_stats


faculty_bp = Blueprint("faculty", __name__)


@faculty_bp.get("")
@roles_required("faculty", "administration")
def list_faculty():
    return success_response([faculty.to_dict() for faculty in Faculty.query.all()])


@faculty_bp.get("/classes")
@roles_required("faculty", "administration")
def faculty_classes():
    assignments = FacultySubjectAssignment.query.all()
    classes = []
    seen = set()
    for assignment in assignments:
        key = assignment.class_id
        if key in seen:
            continue
        seen.add(key)
        classes.append(
            {
                "id": str(assignment.class_id),
                "name": assignment.institute_class.name,
                "section": assignment.institute_class.section,
            }
        )
    return success_response(classes)


@faculty_bp.get("/classes/overview")
@roles_required("faculty", "administration")
def faculty_classes_overview():
    assignments = FacultySubjectAssignment.query.all()
    classes: dict[int, dict] = {}

    for assignment in assignments:
        class_id = assignment.class_id
        class_entry = classes.setdefault(
            class_id,
            {
                "id": str(class_id),
                "name": assignment.institute_class.name,
                "section": assignment.institute_class.section,
                "studentCount": len(assignment.institute_class.enrollments),
                "subjects": [],
            },
        )

        subject_payload = assignment.subject.to_dict()
        materials = Material.query.filter_by(subject_id=assignment.subject_id).all()
        subject_payload["materials"] = [material.to_dict() for material in materials]
        class_entry["subjects"].append(subject_payload)

    return success_response(list(classes.values()))


@faculty_bp.get("/classes/<int:class_id>/subjects")
@roles_required("faculty", "administration")
def class_subjects(class_id: int):
    assignments = FacultySubjectAssignment.query.filter_by(class_id=class_id).all()
    return success_response([assignment.subject.to_dict() for assignment in assignments])


@faculty_bp.get("/subjects/<int:subject_id>/materials")


@faculty_bp.get("/upcoming-courses")
@roles_required("faculty", "administration")
def get_faculty_upcoming_courses():
    faculty = Faculty.query.filter_by(user_id=g.current_user.id).first()
    if faculty is None:
        raise ApiError(404, "FACULTY_NOT_FOUND", "Faculty profile was not found.")

    assigned_class_ids = [a.class_id for a in FacultySubjectAssignment.query.filter_by(faculty_id=faculty.id).all()]
    if not assigned_class_ids:
        return success_response([])

    courses = (
        UpcomingCourse.query.filter(
            UpcomingCourse.class_id.in_(assigned_class_ids),
            UpcomingCourse.status == "active",
        )
        .order_by(UpcomingCourse.start_date.asc())
        .all()
    )
    return success_response([course.to_dict() for course in courses])


@roles_required("faculty", "administration")
def subject_materials(subject_id: int):
    materials = Material.query.filter_by(subject_id=subject_id).all()
    if not materials:
        raise ApiError(404, "MATERIALS_NOT_FOUND", "No materials found for the selected subject.")
    return success_response([material.to_dict() for material in materials])


@faculty_bp.post("/subjects/<int:subject_id>/materials")
@roles_required("faculty", "administration")
def publish_subject_material(subject_id: int):
    subject = db.session.get(Subject, subject_id)
    if subject is None:
        raise ApiError(404, "SUBJECT_NOT_FOUND", "Subject was not found.")
    payload = parse_json(MaterialCreateRequest, request.get_json())
    material = Material(
        subject_id=subject_id,
        title=payload.title,
        unit=payload.unit,
        week=payload.week,
        material_type=payload.material_type,
        description=payload.description,
    )
    db.session.add(material)
    db.session.commit()
    return success_response(material.to_dict(), status_code=201)


@faculty_bp.get("/performance/students")
@roles_required("faculty", "administration")
def faculty_student_performance():
    class_id = request.args.get("classId")
    students_query = Student.query
    if class_id:
        students_query = students_query.join(ClassEnrollment, ClassEnrollment.student_id == Student.id).filter(
            ClassEnrollment.class_id == int(class_id)
        )

    students = []
    for student in students_query.all():
        enrollment = student.current_enrollment()
        marks = Mark.query.filter_by(student_id=student.id).all()
        attendance = get_attendance_stats(student.id)
        average_marks = round(sum(mark.marks_obtained for mark in marks) / len(marks), 2) if marks else 0
        trend = "stable"
        if len(marks) >= 2:
            trend = "up" if marks[-1].marks_obtained >= marks[0].marks_obtained else "down"
        students.append(
            {
                "id": str(student.id),
                "name": f"{student.user.first_name} {student.user.last_name}",
                "rollNumber": student.roll_number,
                "class": enrollment.institute_class.name if enrollment else "",
                "section": enrollment.institute_class.section if enrollment else "",
                "overallGrade": "A" if average_marks >= 85 else "B+" if average_marks >= 70 else "B" if average_marks >= 55 else "C",
                "attendance": round(attendance["percentage"]),
                "performanceTrend": trend,
                "marks": [
                    {
                        "subject": mark.to_dict().get("subject"),
                        "marks": mark.marks_obtained,
                        "totalMarks": mark.total_marks,
                        "grade": "A+" if mark.marks_obtained >= 90 else "A" if mark.marks_obtained >= 80 else "B+" if mark.marks_obtained >= 70 else "B",
                    }
                    for mark in marks
                ],
            }
        )

    return success_response(students)
