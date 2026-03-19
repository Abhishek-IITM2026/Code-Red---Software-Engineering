export type LeaveApplicantRole = "student" | "faculty";
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantRole: LeaveApplicantRole;
  applicantContext: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  contactNumber: string;
  supportingNote?: string;
  submittedAt: string;
  status: LeaveStatus;
  reviewerName?: string;
  reviewerComment?: string;
}

export interface LeaveRequestInput {
  applicantId: string;
  applicantName: string;
  applicantRole: LeaveApplicantRole;
  applicantContext: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  contactNumber: string;
  supportingNote?: string;
}
