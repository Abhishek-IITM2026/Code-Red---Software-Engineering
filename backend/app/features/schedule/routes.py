from datetime import datetime

from flask import Blueprint, request, g
from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import AuthorityAssignment, Faculty, InstituteClass, Parent, Schedule
from ...schemas import ScheduleListQuery, ScheduleWriteRequest, parse_json, parse_query
from ...services.query import get_current_student, get_enrollment_class_scope_ids


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


def _expand_class_scope_ids(class_id: int, section_id: str | None = None) -> list[int]:
    class_ids: set[int] = {int(class_id)}
    institute_class = db.session.get(InstituteClass, int(class_id))
    if institute_class is None:
        return sorted(class_ids)

    section = section_id or institute_class.section
    related_classes = InstituteClass.query.filter_by(
        name=institute_class.name,
        section=section,
    ).all()
    class_ids.update(item.id for item in related_classes)
    return sorted(class_ids)


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


def _normalize_schedule_time(value: str, *, field_name: str) -> str:
    normalized = (value or "").strip()
    try:
        parsed = datetime.strptime(normalized, "%H:%M")
    except ValueError as exc:
        raise ApiError(422, "INVALID_TIME_FORMAT", f"{field_name} must use HH:MM 24-hour format.") from exc
    return parsed.strftime("%H:%M")


def _validate_schedule_conflicts(
    *,
    class_id: int,
    faculty_id: int,
    day_of_week: int,
    start_time: str,
    end_time: str,
    schedule_id: int | None = None,
) -> tuple[str, str]:
    normalized_start = _normalize_schedule_time(start_time, field_name="startTime")
    normalized_end = _normalize_schedule_time(end_time, field_name="endTime")

    if normalized_start >= normalized_end:
        raise ApiError(422, "INVALID_TIME_RANGE", "Schedule end time must be later than the start time.")

    conflict_query = Schedule.query.filter(
        Schedule.day_of_week == day_of_week,
        Schedule.start_time < normalized_end,
        Schedule.end_time > normalized_start,
        Schedule.is_active.is_(True),
        (Schedule.class_id == class_id) | (Schedule.faculty_id == faculty_id),
    )

    if schedule_id is not None:
        conflict_query = conflict_query.filter(Schedule.id != schedule_id)

    conflict = conflict_query.order_by(Schedule.start_time.asc(), Schedule.id.asc()).first()
    if conflict is not None:
        if conflict.class_id == class_id and conflict.faculty_id == faculty_id:
            conflict_scope = "class and faculty"
        elif conflict.class_id == class_id:
            conflict_scope = "class"
        else:
            conflict_scope = "faculty"
        raise ApiError(
            409,
            "SCHEDULE_CONFLICT",
            f"This time overlaps with an existing {conflict_scope} schedule.",
            {
                "conflictSchedule": conflict.to_dict(),
            },
        )

    return normalized_start, normalized_end


@schedule_bp.get("")
@roles_required("student", "faculty", "parent", "administration")
def list_schedule():
    filters = parse_query(ScheduleListQuery, request.args.to_dict())
    query = Schedule.query

    if g.current_user.has_any_role("administration", "admin", "director", "superadmin"):
        pass
    elif g.current_user.has_any_role("faculty", "teacher"):
        faculty_profile = _current_faculty_profile()
        if faculty_profile is None:
            raise ApiError(403, "FORBIDDEN", "Faculty profile is required to access schedules.")
        query = query.filter_by(faculty_id=faculty_profile.id)
    elif g.current_user.has_any_role("student"):
        student = get_current_student()
        enrollment = student.current_enrollment()
        if enrollment is None:
            return success_response([])
        class_scope_ids = get_enrollment_class_scope_ids(enrollment)
        query = query.filter(Schedule.class_id.in_(class_scope_ids))
    elif g.current_user.has_any_role("parent"):
        parent = Parent.query.filter_by(user_id=g.current_user.id).first()
        if parent is None or parent.student is None:
            raise ApiError(404, "PARENT_NOT_FOUND", "Parent profile was not found.")
        enrollment = parent.student.current_enrollment()
        if enrollment is None:
            return success_response([])
        class_scope_ids = get_enrollment_class_scope_ids(enrollment)
        query = query.filter(Schedule.class_id.in_(class_scope_ids))

    if filters.class_id:
        class_scope_ids = _expand_class_scope_ids(filters.class_id, filters.section_id)
        query = query.filter(Schedule.class_id.in_(class_scope_ids))
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

    start_time, end_time = _validate_schedule_conflicts(
        class_id=payload.class_id,
        faculty_id=faculty_id,
        day_of_week=payload.day_of_week,
        start_time=payload.time_slot.start_time if payload.time_slot else (payload.start_time or "09:00"),
        end_time=payload.time_slot.end_time if payload.time_slot else (payload.end_time or "10:00"),
    )

    schedule = Schedule(
        class_id=payload.class_id,
        subject_id=payload.subject_id,
        faculty_id=faculty_id,
        day_of_week=payload.day_of_week,
        start_time=start_time,
        end_time=end_time,
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

    start_time, end_time = _validate_schedule_conflicts(
        class_id=payload.class_id,
        faculty_id=schedule.faculty_id,
        day_of_week=payload.day_of_week,
        start_time=payload.time_slot.start_time if payload.time_slot else (payload.start_time or schedule.start_time),
        end_time=payload.time_slot.end_time if payload.time_slot else (payload.end_time or schedule.end_time),
        schedule_id=schedule.id,
    )
    schedule.day_of_week = payload.day_of_week
    schedule.class_id = payload.class_id
    schedule.subject_id = payload.subject_id
    schedule.room_number = payload.room_number or schedule.room_number
    schedule.start_time = start_time
    schedule.end_time = end_time
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
    class_scope_ids = get_enrollment_class_scope_ids(enrollment) if enrollment else []
    query = (
        Schedule.query.filter(Schedule.class_id.in_(class_scope_ids), Schedule.is_active.is_(True))
        .order_by(Schedule.day_of_week.asc(), Schedule.start_time.asc(), Schedule.id.asc())
        if class_scope_ids
        else Schedule.query.filter_by(id=-1)
    )
    return success_response([item.to_dict() for item in query.all()])


@schedule_bp.get("/available-slots")
@roles_required("faculty", "teacher", "administration")
def get_available_slots():
    """
    Get available time slots for a specific day, class, and faculty.
    Returns all time slots that don't conflict with existing schedules.
    """
    class_id = request.args.get("classId", type=int)
    faculty_id = request.args.get("facultyId", type=int)
    day_of_week = request.args.get("dayOfWeek", type=int)

    if class_id is None or faculty_id is None or day_of_week is None:
        raise ApiError(400, "MISSING_PARAMETERS", "classId, facultyId, and dayOfWeek are required.")

    # Resolve faculty ID
    resolved_faculty_id = _resolve_faculty_id(faculty_id)
    if resolved_faculty_id is None:
        raise ApiError(404, "FACULTY_NOT_FOUND", "Selected faculty was not found.")

    # Get all schedules for this class OR faculty on this day
    existing_schedules = Schedule.query.filter(
        Schedule.day_of_week == day_of_week,
        Schedule.is_active.is_(True),
        (Schedule.class_id == class_id) | (Schedule.faculty_id == resolved_faculty_id),
    ).order_by(Schedule.start_time.asc()).all()

    # Define standard time slots (8 AM to 5 PM, 1-hour slots)
    standard_slots = [
        ("08:00", "09:00"),
        ("09:00", "10:00"),
        ("10:00", "11:00"),
        ("11:00", "12:00"),
        ("12:00", "13:00"),
        ("13:00", "14:00"),
        ("14:00", "15:00"),
        ("15:00", "16:00"),
        ("16:00", "17:00"),
    ]

    # Find available slots (not overlapping with any existing schedule)
    available_slots = []
    for start, end in standard_slots:
        is_available = True
        for schedule in existing_schedules:
            # Check if this slot overlaps with existing schedule
            if schedule.start_time < end and schedule.end_time > start:
                is_available = False
                break
        
        if is_available:
            available_slots.append({
                "startTime": start,
                "endTime": end,
                "label": f"{start} - {end}",
            })

    # Also include existing schedules in the response for reference
    occupied_slots = [
        {
            "startTime": s.start_time,
            "endTime": s.end_time,
            "label": f"{s.start_time} - {s.end_time}",
            "classId": s.class_id,
            "facultyId": s.faculty_id,
            "subject": s.subject.name if s.subject else None,
        }
        for s in existing_schedules
    ]

    return success_response({
        "availableSlots": available_slots,
        "occupiedSlots": occupied_slots,
        "dayOfWeek": day_of_week,
        "classId": class_id,
        "facultyId": resolved_faculty_id,
    })
