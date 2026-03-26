from pydantic import Field

from .validation import StrictModel


class AttendanceRecordRequest(StrictModel):
    student_id: int = Field(alias="studentId")
    subject_id: int | None = Field(default=None, alias="subjectId")
    status: str


class AttendanceSubmissionRequest(StrictModel):
    attendance_date: str = Field(alias="date")
    class_id: int = Field(alias="class")
    section: str | None = None
    records: list[AttendanceRecordRequest]
