from pydantic import Field

from .validation import StrictModel


class TimeSlotRequest(StrictModel):
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")


class ScheduleWriteRequest(StrictModel):
    class_id: int = Field(alias="classId")
    subject_id: int = Field(default=1, alias="subjectId")
    faculty_id: int = Field(alias="facultyId")
    day_of_week: int = Field(alias="dayOfWeek")
    time_slot: TimeSlotRequest | None = Field(default=None, alias="timeSlot")
    start_time: str | None = Field(default=None, alias="startTime")
    end_time: str | None = Field(default=None, alias="endTime")
    room_number: str | None = Field(default=None, alias="roomNumber")


class ScheduleListQuery(StrictModel):
    class_id: int | None = Field(default=None, alias="classId")
    section_id: str | None = Field(default=None, alias="sectionId")
    faculty_id: int | None = Field(default=None, alias="facultyId")
