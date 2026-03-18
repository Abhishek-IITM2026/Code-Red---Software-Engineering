import type { LeaveApplicantRole, LeaveRequest, LeaveRequestInput, LeaveStatus } from "./types";

const STORAGE_KEY = "school-leave-management-v1";

const seedLeaveRequests: LeaveRequest[] = [
  {
    id: "LV-1001",
    applicantId: "1",
    applicantName: "John Student",
    applicantRole: "student",
    applicantContext: "Class 10 A",
    leaveType: "Sick Leave",
    fromDate: "2026-03-17",
    toDate: "2026-03-18",
    totalDays: 2,
    reason: "Recovering from viral fever and advised rest by family doctor.",
    contactNumber: "+91 98765 12001",
    supportingNote: "Medical note submitted to class teacher.",
    submittedAt: "2026-03-16T09:15:00.000Z",
    status: "Approved",
    reviewerName: "Admin User",
    reviewerComment: "Approved for two days. Submit missed classwork after return.",
  },
  {
    id: "LV-1002",
    applicantId: "2",
    applicantName: "Jane Teacher",
    applicantRole: "faculty",
    applicantContext: "Mathematics Department",
    leaveType: "Casual Leave",
    fromDate: "2026-03-20",
    toDate: "2026-03-20",
    totalDays: 1,
    reason: "Personal work outside campus for one day.",
    contactNumber: "+91 98765 12002",
    supportingNote: "Class coverage shared with faculty coordinator.",
    submittedAt: "2026-03-18T11:05:00.000Z",
    status: "Pending",
  },
  {
    id: "LV-1003",
    applicantId: "7",
    applicantName: "Ananya Menon",
    applicantRole: "faculty",
    applicantContext: "Science Department",
    leaveType: "Emergency Leave",
    fromDate: "2026-03-19",
    toDate: "2026-03-19",
    totalDays: 1,
    reason: "Urgent family medical appointment.",
    contactNumber: "+91 98765 12007",
    supportingNote: "Lab sessions reassigned to Rahul Varma.",
    submittedAt: "2026-03-18T15:45:00.000Z",
    status: "Rejected",
    reviewerName: "Admin User",
    reviewerComment: "Please reapply with alternate lab coverage for full day approval.",
  },
  {
    id: "LV-1004",
    applicantId: "8",
    applicantName: "Meera Nair",
    applicantRole: "student",
    applicantContext: "Class 10 B",
    leaveType: "Family Function",
    fromDate: "2026-03-24",
    toDate: "2026-03-25",
    totalDays: 2,
    reason: "Traveling out of station for a close family function.",
    contactNumber: "+91 98765 12008",
    supportingNote: "Will collect assignments in advance.",
    submittedAt: "2026-03-18T07:30:00.000Z",
    status: "Pending",
  },
];

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const getStoredRequests = (): LeaveRequest[] => {
  if (!canUseStorage()) {
    return seedLeaveRequests;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedLeaveRequests));
    return seedLeaveRequests;
  }

  try {
    const parsed = JSON.parse(rawValue) as LeaveRequest[];
    return parsed;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedLeaveRequests));
    return seedLeaveRequests;
  }
};

const saveRequests = (requests: LeaveRequest[]) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

export const calculateLeaveDays = (fromDate: string, toDate: string) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diff = to.getTime() - from.getTime();

  if (Number.isNaN(diff) || diff < 0) {
    return 1;
  }

  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

export const getLeaveRequests = () =>
  [...getStoredRequests()].sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime());

export const getLeaveRequestsForApplicant = (applicantId: string, applicantRole: LeaveApplicantRole) =>
  getLeaveRequests().filter((request) => request.applicantId === applicantId && request.applicantRole === applicantRole);

export const submitLeaveRequest = (input: LeaveRequestInput) => {
  const requests = getStoredRequests();
  const nextRequest: LeaveRequest = {
    id: `LV-${Date.now()}`,
    applicantId: input.applicantId,
    applicantName: input.applicantName,
    applicantRole: input.applicantRole,
    applicantContext: input.applicantContext,
    leaveType: input.leaveType,
    fromDate: input.fromDate,
    toDate: input.toDate,
    totalDays: calculateLeaveDays(input.fromDate, input.toDate),
    reason: input.reason,
    contactNumber: input.contactNumber,
    supportingNote: input.supportingNote,
    submittedAt: new Date().toISOString(),
    status: "Pending",
  };

  const nextRequests = [nextRequest, ...requests];
  saveRequests(nextRequests);
  return nextRequest;
};

export const reviewLeaveRequest = (
  requestId: string,
  status: Extract<LeaveStatus, "Approved" | "Rejected">,
  reviewerName: string,
  reviewerComment: string,
) => {
  const requests = getStoredRequests();
  const nextRequests = requests.map((request) =>
    request.id === requestId
      ? {
          ...request,
          status,
          reviewerName,
          reviewerComment,
        }
      : request,
  );

  saveRequests(nextRequests);
  return nextRequests;
};
