from pydantic import Field

from .validation import StrictModel


class ScheduleNotificationRequest(StrictModel):
    message: str = "Schedule updated."
    recipient_scope: str = Field(default="all", alias="recipientScope")


class EmailSendRequest(StrictModel):
    to: list[str] = Field(default_factory=list)
    cc: list[str] = Field(default_factory=list)
    bcc: list[str] = Field(default_factory=list)
    subject: str
    text: str | None = None
    html: str | None = None
    category: str = "general"


class EmailSyncRequest(StrictModel):
    limit: int = 20
    mailbox: str | None = None
    unseen_only: bool = Field(default=False, alias="unseenOnly")


class EmailMessageListQuery(StrictModel):
    direction: str | None = None
    status: str | None = None
    limit: int = 50
