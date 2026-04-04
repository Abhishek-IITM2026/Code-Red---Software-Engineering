from datetime import datetime, date

from app.extensions import db


class LeaveRequest(db.Model):
    """Model for leave requests submitted by students and faculty."""

    __tablename__ = "leave_requests"

    id = db.Column(db.Integer, primary_key=True)
    applicant_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    applicant_role = db.Column(db.String(20), nullable=False)  # "student" or "faculty"
    applicant_context = db.Column(db.String(100), nullable=False)  # e.g., "Class 10 A" or "Mathematics Department"

    leave_type = db.Column(db.String(50), nullable=False)
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Integer, nullable=False)

    reason = db.Column(db.Text, nullable=False)
    contact_number = db.Column(db.String(20), nullable=False)
    supporting_note = db.Column(db.Text, nullable=True)

    status = db.Column(db.String(20), nullable=False, default="Pending")  # Pending, Approved, Rejected

    reviewer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    reviewer_name = db.Column(db.String(100), nullable=True)
    reviewer_comment = db.Column(db.Text, nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)

    submitted_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    applicant = db.relationship("User", foreign_keys=[applicant_id], backref="leave_requests")
    reviewer = db.relationship("User", foreign_keys=[reviewer_id], backref="reviewed_leaves")

    def to_dict(self) -> dict:
        """Convert leave request to dictionary."""
        # Get applicant name from relationship
        applicant_name = f"{self.applicant.first_name} {self.applicant.last_name}" if self.applicant else "Unknown"
        
        return {
            "id": str(self.id),
            "applicantId": str(self.applicant_id),
            "applicantName": applicant_name,
            "applicantRole": self.applicant_role,
            "applicantContext": self.applicant_context,
            "leaveType": self.leave_type,
            "fromDate": self.from_date.isoformat() if isinstance(self.from_date, date) else self.from_date,
            "toDate": self.to_date.isoformat() if isinstance(self.to_date, date) else self.to_date,
            "totalDays": self.total_days,
            "reason": self.reason,
            "contactNumber": self.contact_number,
            "supportingNote": self.supporting_note,
            "status": self.status,
            "reviewerId": str(self.reviewer_id) if self.reviewer_id else None,
            "reviewerName": self.reviewer_name,
            "reviewerComment": self.reviewer_comment,
            "reviewedAt": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "submittedAt": self.submitted_at.isoformat() if self.submitted_at else None,
        }