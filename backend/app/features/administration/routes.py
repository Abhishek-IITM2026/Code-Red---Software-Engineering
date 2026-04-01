from flask import Blueprint, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import AdministrationStaff, ClassEnrollment, Faculty, InstituteClass, Mark, Parent, Student, UserContactProfile
from ...schemas import PromotionActionRequest, parse_json
from ...services.query import get_attendance_stats, get_performance_summary


administration_bp = Blueprint("administration", __name__)


def _staff_payloads():
    staff = []
    for faculty in Faculty.query.all():
        staff.append(
            {
                "staffId": f"ST-{200 + faculty.id}",
                "employeeCode": f"EMP-0{10 + faculty.id - 1}",
                "name": f"{faculty.user.first_name} {faculty.user.last_name}",
                "category": "Teaching",
                "role": faculty.subject_specialization or faculty.user.title or "Faculty",
                "department": faculty.subject_specialization or "Academics",
                "joiningDate": faculty.hire_date.isoformat() if faculty.hire_date else None,
                "phone": faculty.user.contact_profile.phone_number if faculty.user.contact_profile else None,
                "status": "Active",
            }
        )
    for member in AdministrationStaff.query.all():
        staff.append(
            {
                "staffId": f"ST-{202 + member.id}",
                "employeeCode": member.employee_code,
                "name": f"{member.user.first_name} {member.user.last_name}",
                "category": "Non-Teaching",
                "role": member.designation or member.user.title or "Administration Staff",
                "department": member.department,
                "joiningDate": member.created_at.date().isoformat() if member.created_at else None,
                "phone": member.user.contact_profile.phone_number if member.user.contact_profile else None,
                "status": "Active",
            }
        )
    return staff


def _promotion_candidate(student: Student):
    enrollment = student.current_enrollment()
    stats = get_attendance_stats(student.id)
    performance = get_performance_summary(student.id)
    grade = int(enrollment.institute_class.grade) if enrollment and enrollment.institute_class.grade.isdigit() else 0
    target_grade = grade + 1 if grade else grade
    parent = Parent.query.filter_by(student_id=student.id, is_primary=True).first()
    parent_phone = parent.user.contact_profile.phone_number if parent and parent.user.contact_profile else None
    return {
        "id": str(student.id),
        "admissionNo": student.roll_number,
        "name": f"{student.user.first_name} {student.user.last_name}",
        "className": enrollment.institute_class.name if enrollment else None,
        "section": enrollment.institute_class.section if enrollment else None,
        "guardian": f"{parent.user.first_name} {parent.user.last_name}" if parent else None,
        "parentPhone": parent_phone,
        "documentName": f"promotion-{student.roll_number or student.id}.pdf",
        "attendance": f"{stats['percentage']}%",
        "average": f"{performance['average']}%",
        "status": "Active" if student.status.value == "ACTIVE" else "Inactive",
        "resultStatus": "Eligible" if stats["percentage"] >= 75 and performance["average"] >= 50 else "Review Required",
        "targetClass": f"Class {target_grade}" if target_grade else None,
        "notes": "Promotion derived from attendance and marks summary.",
    }


@administration_bp.get("/staff")
@roles_required("administration")
def list_staff():
    return success_response(_staff_payloads())


@administration_bp.get("/promotions/candidates")
@roles_required("administration")
def list_promotion_candidates():
    target_class = request.args.get("targetClass")
    candidates = [_promotion_candidate(student) for student in Student.query.all()]
    if target_class:
        candidates = [candidate for candidate in candidates if candidate["targetClass"] == target_class]
    return success_response(candidates)


@administration_bp.post("/promotions/<int:student_id>")
@roles_required("administration")
def promote_student(student_id: int):
    student = db.session.get(Student, student_id)
    if student is None:
        raise ApiError(404, "STUDENT_NOT_FOUND", "Student was not found.")
    payload = parse_json(PromotionActionRequest, request.get_json())
    enrollment = student.current_enrollment()
    if enrollment and enrollment.institute_class.name == payload.target_class:
        raise ApiError(409, "ALREADY_PROMOTED", "Student is already enrolled in the target class.")
    target_class = InstituteClass.query.filter_by(name=payload.target_class, academic_year=payload.academic_year or "2025-2026").first()
    if target_class is None:
        target_grade = "".join(ch for ch in payload.target_class if ch.isdigit()) or "0"
        target_class = InstituteClass(
            name=payload.target_class,
            grade=target_grade,
            section=enrollment.institute_class.section if enrollment else "A",
            academic_year=payload.academic_year or "2025-2026",
        )
        db.session.add(target_class)
        db.session.flush()
    db.session.add(
        ClassEnrollment(
            student_id=student.id,
            class_id=target_class.id,
            academic_year=payload.academic_year or "2025-2026",
        )
    )
    db.session.commit()
    return success_response(
        {
            "studentId": str(student.id),
            "targetClass": target_class.name,
            "academicYear": payload.academic_year or "2025-2026",
            "promoted": True,
        }
    )
