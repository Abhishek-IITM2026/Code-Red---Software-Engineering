from datetime import date

from flask import Blueprint, g, request

from ...api.errors import ApiError
from ...common.auth import roles_required, user_role_names
from ...common.responses import success_response
from ...extensions import db
from ...models import Attendance, Student
from ...schemas import AttendanceSubmissionRequest, parse_json
from ...services.query import get_attendance_stats, get_current_student


attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.get("")
@roles_required("student", "faculty", "administration")
def get_attendance():
    query = Attendance.query

    if "student" in user_role_names(g.current_user) and request.args.get("studentId"):
        student = get_current_student()
        if str(student.id) != request.args["studentId"]:
            raise ApiError(403, "FORBIDDEN", "Students can only access their own attendance records.")
    if request.args.get("studentId"):
        query = query.filter_by(student_id=int(request.args["studentId"]))
    if request.args.get("subjectId"):
        query = query.filter_by(subject_id=int(request.args["subjectId"]))
    if request.args.get("date"):
        query = query.filter_by(attendance_date=date.fromisoformat(request.args["date"]))
    if request.args.get("class"):
        query = query.filter_by(class_id=int(request.args["class"]))
    if request.args.get("startDate"):
        query = query.filter(Attendance.attendance_date >= date.fromisoformat(request.args["startDate"]))
    if request.args.get("endDate"):
        query = query.filter(Attendance.attendance_date <= date.fromisoformat(request.args["endDate"]))
    if request.args.get("section"):
        query = query.join(Attendance.institute_class).filter_by(section=request.args["section"])
    return success_response([record.to_dict() for record in query.all()])


def _save_attendance(status_code: int):
    payload = parse_json(AttendanceSubmissionRequest, request.get_json())
    records = payload.records
    if not payload.attendance_date or not payload.class_id or not records:
        raise ApiError(400, "VALIDATION_ERROR", "date, class and at least one attendance record are required.")

    saved = 0
    for record in records:
        attendance = Attendance.query.filter_by(
            student_id=record.student_id,
            class_id=payload.class_id,
            attendance_date=date.fromisoformat(payload.attendance_date),
        ).first()
        if attendance is None:
            attendance = Attendance(
                student_id=record.student_id,
                class_id=payload.class_id,
                subject_id=record.subject_id or 1,
                attendance_date=date.fromisoformat(payload.attendance_date),
                marked_by=2,
                status=record.status.upper(),
            )
            db.session.add(attendance)
        else:
            attendance.status = record.status.upper()
        saved += 1

    db.session.commit()
    return success_response({"success": True, "count": saved}, status_code=status_code)


@attendance_bp.post("")
@roles_required("faculty", "administration")
def create_attendance():
    return _save_attendance(201)


@attendance_bp.put("")
@roles_required("faculty", "administration")
def update_attendance():
    return _save_attendance(200)


@attendance_bp.get("/me/stats")
@roles_required("student")
def my_attendance_stats():
    student = get_current_student()
    return success_response(get_attendance_stats(student.id))
