export const initialStudents = [
  { id: "S-101", name: "Aarav Reddy", className: "Class 10", section: "A", guardian: "Ramesh Reddy" },
  { id: "S-102", name: "Diya Sharma", className: "Class 9", section: "B", guardian: "Neha Sharma" },
  { id: "S-103", name: "Vikram Rao", className: "Class 8", section: "A", guardian: "Mohan Rao" },
];

export const examSchedule = [
  { className: "Class 10", exam: "Mid Term", date: "2026-03-18", hall: "Hall A", status: "Scheduled" },
  { className: "Class 9", exam: "Mid Term", date: "2026-03-19", hall: "Hall B", status: "Scheduled" },
  { className: "Class 8", exam: "Unit Test", date: "2026-03-20", hall: "Hall C", status: "Hall Allotted" },
];

export const promotionRows = [
  { className: "Class 10 A", eligible: 38, pendingReview: 2, target: "Class 11" },
  { className: "Class 9 B", eligible: 41, pendingReview: 1, target: "Class 10" },
  { className: "Class 8 A", eligible: 39, pendingReview: 3, target: "Class 9" },
];

export const attendanceReportRows = [
  { className: "Class 10 A", attendance: "91%", lowAttendance: 3, coordinator: "Mrs. Deepa Menon" },
  { className: "Class 9 B", attendance: "88%", lowAttendance: 5, coordinator: "Mr. Rahul Mehta" },
  { className: "Class 8 A", attendance: "93%", lowAttendance: 2, coordinator: "Ms. Sneha Rao" },
];

export const performanceTrendRows = [
  { className: "Class 10 A", average: "84%", strongest: "Chemistry", needsAttention: "Physics numericals" },
  { className: "Class 9 B", average: "79%", strongest: "Mathematics", needsAttention: "Writing discipline" },
  { className: "Class 8 A", average: "86%", strongest: "Science", needsAttention: "Social test readiness" },
];

export const examParticipationRows = [
  { className: "Class 10", registered: 40, appeared: 39, absent: 1, status: "Ready for evaluation" },
  { className: "Class 9", registered: 42, appeared: 41, absent: 1, status: "Attendance sheet locked" },
  { className: "Class 8", registered: 43, appeared: 43, absent: 0, status: "Completed" },
];
