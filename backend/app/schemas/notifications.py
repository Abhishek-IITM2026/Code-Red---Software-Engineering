from pydantic import Field

from .validation import StrictModel


class ScheduleNotificationRequest(StrictModel):
    message: str = "Schedule updated."
    recipient_scope: str = Field(default="all", alias="recipientScope")
