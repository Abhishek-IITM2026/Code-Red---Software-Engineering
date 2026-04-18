export interface StudentRecord {
  id: string;
  admissionNo: string;
  name: string;
  className: string;
  section: string;
  guardian: string;
  parentPhone: string;
  documentName: string;
  attendance: string;
  average: string;
  status: "Active" | "Inactive";
}

export interface PromotionCandidate extends StudentRecord {
  resultStatus: "Eligible" | "Review Required";
  targetClass: string;
  notes: string;
}

export interface StaffRecord {
  id: string;
  employeeCode: string;
  name: string;
  category: "Teaching" | "Non-Teaching";
  role: string;
  department: string;
  joiningDate: string;
  phone: string;
  status: "Active" | "On Leave" | "Inactive";
}

export interface SalaryHistoryEntry {
  month: string;
  previousSalary: string;
  increment: string;
  revisedSalary: string;
  payoutStatus: "Released" | "Pending";
}

export interface StaffFinancialRecord {
  staffId: string;
  staffName: string;
  category: "Teaching" | "Non-Teaching";
  role: string;
  bankAccount: string;
  currentSalary: string;
  lastIncrement: string;
  nextReview: string;
  earningsBreakdown: Array<{ label: string; amount: string }>;
  salaryHistory: SalaryHistoryEntry[];
}

export const classOptions = ["Class 8", "Class 9", "Class 10", "Class 11"];
export const sectionOptions = ["A", "B", "C"];
export const staffCategories = ["Teaching", "Non-Teaching"] as const;
export const teachingRoles = ["Mathematics Teacher", "Science Teacher", "English Teacher", "Class Coordinator"];
export const nonTeachingRoles = ["Accountant", "Lab Assistant", "Office Administrator", "Transport Coordinator"];

export const initialStudents: StudentRecord[] = [
  {
    id: "S-101",
    admissionNo: "ADM-24011",
    name: "Aarav Reddy",
    className: "Class 10",
    section: "A",
    guardian: "Ramesh Reddy",
    parentPhone: "+91 98765 11220",
    documentName: "aadhaar-aarav.pdf",
    attendance: "94%",
    average: "88%",
    status: "Active",
  },
  {
    id: "S-102",
    admissionNo: "ADM-24018",
    name: "Diya Sharma",
    className: "Class 9",
    section: "B",
    guardian: "Neha Sharma",
    parentPhone: "+91 98765 22014",
    documentName: "transfer-certificate-diya.pdf",
    attendance: "91%",
    average: "84%",
    status: "Active",
  },
  {
    id: "S-103",
    admissionNo: "ADM-24023",
    name: "Vikram Rao",
    className: "Class 8",
    section: "A",
    guardian: "Mohan Rao",
    parentPhone: "+91 98765 33092",
    documentName: "progress-card-vikram.pdf",
    attendance: "87%",
    average: "79%",
    status: "Inactive",
  },
  {
    id: "S-104",
    admissionNo: "ADM-24031",
    name: "Meera Nair",
    className: "Class 10",
    section: "B",
    guardian: "Anita Nair",
    parentPhone: "+91 98765 44218",
    documentName: "admission-form-meera.pdf",
    attendance: "96%",
    average: "92%",
    status: "Active",
  },
  {
    id: "S-105",
    admissionNo: "ADM-24035",
    name: "Kabir Das",
    className: "Class 9",
    section: "A",
    guardian: "Sonal Das",
    parentPhone: "+91 98765 55107",
    documentName: "medical-record-kabir.pdf",
    attendance: "89%",
    average: "81%",
    status: "Active",
  },
];

export const promotionStudents: PromotionCandidate[] = [
  {
    ...initialStudents[0],
    resultStatus: "Eligible",
    targetClass: "Class 11",
    notes: "Consistent performance across all subjects.",
  },
  {
    ...initialStudents[1],
    resultStatus: "Eligible",
    targetClass: "Class 10",
    notes: "Attendance and assessment record meet promotion criteria.",
  },
  {
    ...initialStudents[2],
    resultStatus: "Review Required",
    targetClass: "Class 9",
    notes: "Needs academic review before promotion decision.",
  },
  {
    ...initialStudents[4],
    resultStatus: "Eligible",
    targetClass: "Class 10",
    notes: "Recommended for promotion after final approval.",
  },
];

export const staffRecords: StaffRecord[] = [
  {
    id: "FAC-001",
    employeeCode: "EMP-010",
    name: "Ananya Menon",
    category: "Teaching",
    role: "Mathematics Teacher",
    department: "Mathematics",
    joiningDate: "2022-06-12",
    phone: "+91 90000 11021",
    status: "Active",
  },
  {
    id: "FAC-002",
    employeeCode: "EMP-011",
    name: "Rahul Varma",
    category: "Teaching",
    role: "Science Teacher",
    department: "Science",
    joiningDate: "2021-03-18",
    phone: "+91 90000 21014",
    status: "Active",
  },
  {
    id: "STAFF-001",
    employeeCode: "EMP-022",
    name: "Sujatha Devi",
    category: "Non-Teaching",
    role: "Accountant",
    department: "Finance",
    joiningDate: "2020-11-03",
    phone: "+91 90000 31009",
    status: "Active",
  },
  {
    id: "STAFF-002",
    employeeCode: "EMP-026",
    name: "Mahesh Kumar",
    category: "Non-Teaching",
    role: "Lab Assistant",
    department: "Laboratory",
    joiningDate: "2023-01-09",
    phone: "+91 90000 41087",
    status: "On Leave",
  },
];

export const staffFinancialRecords: StaffFinancialRecord[] = [
  {
    staffId: "FAC-001",
    staffName: "Ananya Menon",
    category: "Teaching",
    role: "Mathematics Teacher",
    bankAccount: "XXXXXX4821",
    currentSalary: "Rs. 58,000",
    lastIncrement: "Rs. 4,000",
    nextReview: "2026-06-30",
    earningsBreakdown: [
      { label: "Basic Pay", amount: "Rs. 41,000" },
      { label: "Academic Allowance", amount: "Rs. 7,000" },
      { label: "Performance Bonus", amount: "Rs. 5,000" },
      { label: "Transport Allowance", amount: "Rs. 5,000" },
    ],
    salaryHistory: [
      { month: "Jan 2026", previousSalary: "Rs. 54,000", increment: "Rs. 4,000", revisedSalary: "Rs. 58,000", payoutStatus: "Released" },
      { month: "Dec 2025", previousSalary: "Rs. 54,000", increment: "Rs. 0", revisedSalary: "Rs. 54,000", payoutStatus: "Released" },
      { month: "Nov 2025", previousSalary: "Rs. 52,000", increment: "Rs. 2,000", revisedSalary: "Rs. 54,000", payoutStatus: "Released" },
    ],
  },
  {
    staffId: "FAC-002",
    staffName: "Rahul Varma",
    category: "Teaching",
    role: "Science Teacher",
    bankAccount: "XXXXXX2754",
    currentSalary: "Rs. 55,500",
    lastIncrement: "Rs. 3,500",
    nextReview: "2026-07-15",
    earningsBreakdown: [
      { label: "Basic Pay", amount: "Rs. 39,000" },
      { label: "Lab Supervision", amount: "Rs. 6,500" },
      { label: "Class Coordination", amount: "Rs. 5,000" },
      { label: "Transport Allowance", amount: "Rs. 5,000" },
    ],
    salaryHistory: [
      { month: "Jan 2026", previousSalary: "Rs. 52,000", increment: "Rs. 3,500", revisedSalary: "Rs. 55,500", payoutStatus: "Released" },
      { month: "Dec 2025", previousSalary: "Rs. 52,000", increment: "Rs. 0", revisedSalary: "Rs. 52,000", payoutStatus: "Released" },
      { month: "Nov 2025", previousSalary: "Rs. 50,000", increment: "Rs. 2,000", revisedSalary: "Rs. 52,000", payoutStatus: "Released" },
    ],
  },
  {
    staffId: "STAFF-001",
    staffName: "Sujatha Devi",
    category: "Non-Teaching",
    role: "Accountant",
    bankAccount: "XXXXXX6845",
    currentSalary: "Rs. 46,000",
    lastIncrement: "Rs. 2,500",
    nextReview: "2026-05-20",
    earningsBreakdown: [
      { label: "Basic Pay", amount: "Rs. 34,000" },
      { label: "Finance Operations", amount: "Rs. 6,000" },
      { label: "Compliance Allowance", amount: "Rs. 3,000" },
      { label: "Transport Allowance", amount: "Rs. 3,000" },
    ],
    salaryHistory: [
      { month: "Jan 2026", previousSalary: "Rs. 43,500", increment: "Rs. 2,500", revisedSalary: "Rs. 46,000", payoutStatus: "Released" },
      { month: "Dec 2025", previousSalary: "Rs. 43,500", increment: "Rs. 0", revisedSalary: "Rs. 43,500", payoutStatus: "Released" },
      { month: "Nov 2025", previousSalary: "Rs. 41,500", increment: "Rs. 2,000", revisedSalary: "Rs. 43,500", payoutStatus: "Released" },
    ],
  },
  {
    staffId: "STAFF-002",
    staffName: "Mahesh Kumar",
    category: "Non-Teaching",
    role: "Lab Assistant",
    bankAccount: "XXXXXX3301",
    currentSalary: "Rs. 31,000",
    lastIncrement: "Rs. 1,500",
    nextReview: "2026-08-05",
    earningsBreakdown: [
      { label: "Basic Pay", amount: "Rs. 24,000" },
      { label: "Lab Support Allowance", amount: "Rs. 4,000" },
      { label: "Shift Allowance", amount: "Rs. 3,000" },
    ],
    salaryHistory: [
      { month: "Jan 2026", previousSalary: "Rs. 29,500", increment: "Rs. 1,500", revisedSalary: "Rs. 31,000", payoutStatus: "Pending" },
      { month: "Dec 2025", previousSalary: "Rs. 29,500", increment: "Rs. 0", revisedSalary: "Rs. 29,500", payoutStatus: "Released" },
      { month: "Nov 2025", previousSalary: "Rs. 28,000", increment: "Rs. 1,500", revisedSalary: "Rs. 29,500", payoutStatus: "Released" },
    ],
  },
];

export const examSchedule = [
  { className: "Class 10", exam: "Mid Term", date: "2026-03-18", hall: "Hall A", status: "Scheduled" },
  { className: "Class 9", exam: "Mid Term", date: "2026-03-19", hall: "Hall B", status: "Scheduled" },
  { className: "Class 8", exam: "Unit Test", date: "2026-03-20", hall: "Hall C", status: "Hall Allotted" },
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
