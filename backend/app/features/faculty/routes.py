import json

from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import ClassEnrollment, Faculty, FacultySubjectAssignment, Mark, Material, Student, Subject
from ...schemas import MaterialCreateRequest, parse_json
from ...services.materials import create_material_with_source, list_subject_materials, serialize_material
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
        subject = assignment.subject or db.session.get(Subject, assignment.subject_id)
        institute_class = assignment.institute_class
        if subject is None or institute_class is None:
            continue

        class_id = assignment.class_id
        class_entry = classes.setdefault(
            class_id,
            {
                "id": str(class_id),
                "name": institute_class.name,
                "section": institute_class.section,
                "studentCount": len(institute_class.enrollments),
                "subjects": [],
            },
        )

        subject_payload = subject.to_dict()
        materials = Material.query.filter_by(subject_id=assignment.subject_id).all()
        subject_payload["materials"] = [serialize_material(material) for material in materials]
        class_entry["subjects"].append(subject_payload)

    return success_response(list(classes.values()))


@faculty_bp.get("/classes/<int:class_id>/subjects")
@roles_required("faculty", "administration")
def class_subjects(class_id: int):
    assignments = FacultySubjectAssignment.query.filter_by(class_id=class_id).all()
    subjects = []
    for assignment in assignments:
        subject = assignment.subject or db.session.get(Subject, assignment.subject_id)
        if subject is not None:
            subjects.append(subject.to_dict())
    return success_response(subjects)


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
        Subject.query.filter(
            Subject.class_id.in_(assigned_class_ids),
            Subject.course_type != "core",
            Subject.status.in_(["upcoming", "active"]),
        )
        .order_by(Subject.start_date.asc(), Subject.id.desc())
        .all()
    )
    return success_response([course.to_dict() for course in courses])


@faculty_bp.get("/subjects/<int:subject_id>/materials")
@roles_required("faculty", "administration")
def subject_materials(subject_id: int):
    subject = db.session.get(Subject, subject_id)
    if subject is None:
        raise ApiError(404, "SUBJECT_NOT_FOUND", "Subject was not found.")
    return success_response(list_subject_materials(subject_id))


@faculty_bp.post("/subjects/<int:subject_id>/materials")
@roles_required("faculty", "administration")
def publish_subject_material(subject_id: int):
    subject = db.session.get(Subject, subject_id)
    if subject is None:
        raise ApiError(404, "SUBJECT_NOT_FOUND", "Subject was not found.")
    payload = _parse_material_create_request()
    material = create_material_with_source(
        subject=subject,
        actor=g.current_user,
        title=payload.title,
        unit=payload.unit,
        week=payload.week,
        material_type=payload.material_type,
        description=payload.description,
        source_text=payload.source_text,
        external_url=payload.external_url,
        image_urls=payload.image_urls,
        document_id=payload.document_id,
        uploaded_file=request.files.get("file"),
    )
    return success_response(serialize_material(material), status_code=201)


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


def _parse_material_create_request() -> MaterialCreateRequest:
    if request.files:
        payload = request.form.to_dict(flat=True)
        image_urls = request.form.getlist("imageUrls")
        if image_urls:
            payload["imageUrls"] = image_urls
        elif payload.get("imageUrls"):
            try:
                payload["imageUrls"] = json.loads(payload["imageUrls"])
            except json.JSONDecodeError:
                payload["imageUrls"] = [payload["imageUrls"]]
        return parse_json(MaterialCreateRequest, payload)

    return parse_json(MaterialCreateRequest, request.get_json())
