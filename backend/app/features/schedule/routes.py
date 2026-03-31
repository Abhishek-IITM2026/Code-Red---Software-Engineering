from flask import Blueprint, request

from ...api.errors import ApiError
from ...common.auth import roles_required
from ...common.responses import success_response
from ...extensions import db
from ...models import Schedule
from ...schemas import ScheduleListQuery, ScheduleWriteRequest, parse_json, parse_query
from ...services.query import get_current_student


schedule_bp = Blueprint("schedule", __name__)


@schedule_bp.get("")
@roles_required("student", "faculty", "parent", "administration")
def list_schedule():
    filters = parse_query(ScheduleListQuery, request.args.to_dict())
    query = Schedule.query
    if filters.class_id:
        query = query.filter_by(class_id=filters.class_id)
    if filters.faculty_id:
        query = query.filter_by(faculty_id=filters.faculty_id)
    if filters.section_id:
        query = query.join(Schedule.institute_class).filter_by(section=filters.section_id)
    return success_response([item.to_dict() for item in query.all()])


@schedule_bp.post("")
@roles_required("administration")
def create_schedule():
    payload = parse_json(ScheduleWriteRequest, request.get_json())
    schedule = Schedule(
        class_id=payload.class_id,
        subject_id=payload.subject_id,
        faculty_id=payload.faculty_id,
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
@roles_required("administration")
def update_schedule(schedule_id: int):
    schedule = db.session.get(Schedule, schedule_id)
    if schedule is None:
        raise ApiError(404, "SCHEDULE_NOT_FOUND", "Schedule entry was not found.")
    payload = parse_json(ScheduleWriteRequest, request.get_json())
    schedule.day_of_week = payload.day_of_week
    schedule.room_number = payload.room_number or schedule.room_number
    schedule.start_time = payload.time_slot.start_time if payload.time_slot else (payload.start_time or schedule.start_time)
    schedule.end_time = payload.time_slot.end_time if payload.time_slot else (payload.end_time or schedule.end_time)
    db.session.commit()
    return success_response(schedule.to_dict())


@schedule_bp.delete("/<int:schedule_id>")
@roles_required("administration")
def delete_schedule(schedule_id: int):
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
