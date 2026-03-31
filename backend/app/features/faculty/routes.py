from flask import Blueprint

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...models import Faculty, FacultySubjectAssignment, Material


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


@faculty_bp.get("/classes/<int:class_id>/subjects")
@roles_required("faculty", "administration")
def class_subjects(class_id: int):
    assignments = FacultySubjectAssignment.query.filter_by(class_id=class_id).all()
    return success_response([assignment.subject.to_dict() for assignment in assignments])


@faculty_bp.get("/subjects/<int:subject_id>/materials")
@roles_required("faculty", "administration")
def subject_materials(subject_id: int):
    materials = Material.query.filter_by(subject_id=subject_id).all()
    if not materials:
        raise ApiError(404, "MATERIALS_NOT_FOUND", "No materials found for the selected subject.")
    return success_response([material.to_dict() for material in materials])
