from flask import Blueprint, request, g

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import Schedule, AuthorityAssignment, Faculty
from ...schemas import ScheduleListQuery, ScheduleWriteRequest, parse_json, parse_query
from ...services.query import get_current_student


schedule_bp = Blueprint("schedule", __name__)


def _current_faculty_profile():
    if not hasattr(g, "current_user") or g.current_user is None:
        return None
    return getattr(g.current_user, "faculty", None)


def _resolve_faculty_id(raw_faculty_id: int | None) -> int | None:
    if raw_faculty_id is None:
        return None

    faculty = db.session.get(Faculty, raw_faculty_id)
    if faculty is not None:
        return faculty.id

    faculty = Faculty.query.filter_by(user_id=raw_faculty_id).first()
    return faculty.id if faculty is not None else None


def _has_schedule_creation_authority():
    """Check if current user has scheduleCreation authority"""
    if not hasattr(g, 'current_user') or g.current_user is None:
        return False
    
    # Check if user is administration (super admin)
    if g.current_user.has_any_role("administration", "admin", "director", "superadmin"):
        return True
    
    # Check if faculty with scheduleCreation authority
    if g.current_user.has_any_role("faculty", "teacher"):
        assignment = AuthorityAssignment.query.filter_by(
            user_id=g.current_user.id
        ).first()
        if assignment:
            authorities = assignment.authorities_json or {}
            return authorities.get("scheduleCreation", False)
    
    return False


@schedule_bp.get("")
@roles_required("student", "faculty", "parent", "administration")
def list_schedule():
    filters = parse_query(ScheduleListQuery, request.args.to_dict())
    query = Schedule.query
    if filters.class_id:
        query = query.filter_by(class_id=filters.class_id)
    if filters.faculty_id:
        resolved_faculty_id = _resolve_faculty_id(filters.faculty_id)
        query = query.filter_by(faculty_id=resolved_faculty_id) if resolved_faculty_id is not None else query.filter_by(id=-1)
    if filters.section_id:
        query = query.join(Schedule.institute_class).filter_by(section=filters.section_id)
    return success_response([item.to_dict() for item in query.all()])


@schedule_bp.post("")
@roles_required("faculty", "teacher", "administration")
def create_schedule():
    # Check authority for faculty
    if g.current_user.has_any_role("faculty", "teacher"):
        if not _has_schedule_creation_authority():
            raise ApiError(403, "INSUFFICIENT_AUTHORITY", "You do not have permission to create schedules. Contact administration.")
    
    payload = parse_json(ScheduleWriteRequest, request.get_json())
    faculty_id = payload.faculty_id

    if g.current_user.has_any_role("faculty", "teacher"):
        faculty_profile = _current_faculty_profile()
        if faculty_profile is None:
            raise ApiError(400, "FACULTY_PROFILE_NOT_FOUND", "Faculty profile is required to create schedules.")
        faculty_id = faculty_profile.id
    else:
        resolved_faculty_id = _resolve_faculty_id(payload.faculty_id)
        if resolved_faculty_id is None:
            raise ApiError(404, "FACULTY_NOT_FOUND", "Selected faculty was not found.")
        faculty_id = resolved_faculty_id

    schedule = Schedule(
        class_id=payload.class_id,
        subject_id=payload.subject_id,
        faculty_id=faculty_id,
        day_of_week=payload.day_of_week,
        start_time=payload.time_slot.start_time if payload.time_slot else (payload.start_time or "09:00"),
        end_time=payload.time_slot.end_time if payload.time_slot else (payload.end_time or "10:00"),
        room_number=payload.room_number,
        academic_year="2025-2026",
    )
    db.session.add(schedule)
    db.session.commit()
    return success_response(schedule.to_dict(), status_code=201)


@schedule_bp.put("/<int:schedule_id>")
@roles_required("faculty", "teacher", "administration")
def update_schedule(schedule_id: int):
    # Check authority for faculty
    if g.current_user.has_any_role("faculty", "teacher"):
        if not _has_schedule_creation_authority():
            raise ApiError(403, "INSUFFICIENT_AUTHORITY", "You do not have permission to update schedules. Contact administration.")
    
    schedule = db.session.get(Schedule, schedule_id)
    if schedule is None:
        raise ApiError(404, "SCHEDULE_NOT_FOUND", "Schedule entry was not found.")
    payload = parse_json(ScheduleWriteRequest, request.get_json())
    if g.current_user.has_any_role("faculty", "teacher"):
        faculty_profile = _current_faculty_profile()
        if faculty_profile is None:
            raise ApiError(400, "FACULTY_PROFILE_NOT_FOUND", "Faculty profile is required to update schedules.")
        schedule.faculty_id = faculty_profile.id
    else:
        resolved_faculty_id = _resolve_faculty_id(payload.faculty_id)
        if resolved_faculty_id is None:
            raise ApiError(404, "FACULTY_NOT_FOUND", "Selected faculty was not found.")
        schedule.faculty_id = resolved_faculty_id
    schedule.day_of_week = payload.day_of_week
    schedule.class_id = payload.class_id
    schedule.subject_id = payload.subject_id
    schedule.room_number = payload.room_number or schedule.room_number
    schedule.start_time = payload.time_slot.start_time if payload.time_slot else (payload.start_time or schedule.start_time)
    schedule.end_time = payload.time_slot.end_time if payload.time_slot else (payload.end_time or schedule.end_time)
    db.session.commit()
    return success_response(schedule.to_dict())


@schedule_bp.delete("/<int:schedule_id>")
@roles_required("faculty", "teacher", "administration")
def delete_schedule(schedule_id: int):
    # Check authority for faculty
    if g.current_user.has_any_role("faculty", "teacher"):
        if not _has_schedule_creation_authority():
            raise ApiError(403, "INSUFFICIENT_AUTHORITY", "You do not have permission to delete schedules. Contact administration.")
    
    schedule = db.session.get(Schedule, schedule_id)
    if schedule is None:
        raise ApiError(404, "SCHEDULE_NOT_FOUND", "Schedule entry was not found.")
    db.session.delete(schedule)
    db.session.commit()
    return "", 204


@schedule_bp.get("/me")
@roles_required("student")
def my_schedule():
    student = get_current_student()
    enrollment = student.current_enrollment()
    query = Schedule.query.filter_by(class_id=enrollment.class_id) if enrollment else Schedule.query.filter_by(id=-1)
    return success_response([item.to_dict() for item in query.all()])
