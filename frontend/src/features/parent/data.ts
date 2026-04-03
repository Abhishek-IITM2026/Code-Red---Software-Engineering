export interface ParentChildProfile {
  id: string;
  name: string;
  className: string;
  classId: string;
  section: string;
  sectionId: string;
}

export interface AttendanceRow {
  subject: string;
  attended: string;
  total: string;
  percentage: string;
}

export interface PerformanceSubject {
  id: string;
  name: string;
  score: string;
  teacher: string;
  report: string[];
  syllabus: string[];
}

export interface FeeTransaction {
  month: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue";
  date: string;
}

export interface FacultyContact {
  subject: string;
  faculty: string;
  phone: string;
}
