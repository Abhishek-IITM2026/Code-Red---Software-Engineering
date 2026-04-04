from pydantic import BaseModel, ConfigDict, Field


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class LeaveRequestCreateRequest(StrictModel):
    """Schema for creating a leave request."""

    leave_type: str = Field(..., alias="leaveType", description="Type of leave (e.g., Sick Leave, Casual Leave)")
    from_date: str = Field(..., alias="fromDate", description="Start date in YYYY-MM-DD format")
    to_date: str = Field(..., alias="toDate", description="End date in YYYY-MM-DD format")
    reason: str = Field(..., description="Reason for leave")
    contact_number: str = Field(..., alias="contactNumber", description="Contact number during leave")
    supporting_note: str | None = Field(default=None, alias="supportingNote", description="Optional supporting note")


class LeaveRequestReviewRequest(StrictModel):
    """Schema for reviewing (approving/rejecting) a leave request."""

    status: str = Field(..., description="New status: 'Approved' or 'Rejected'")
    reviewer_comment: str | None = Field(default=None, alias="reviewerComment", description="Optional comment from reviewer")
