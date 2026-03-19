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

export const childProfiles: ParentChildProfile[] = [
  {
    id: "child-1",
    name: "Aarav Reddy",
    className: "Class 10",
    classId: "10",
    section: "A",
    sectionId: "10-A",
  },
  {
    id: "child-2",
    name: "Diya Reddy",
    className: "Class 8",
    classId: "8",
    section: "B",
    sectionId: "8-B",
  },
];

export const attendanceByChild: Record<string, AttendanceRow[]> = {
  "child-1": [
    { subject: "Mathematics", attended: "35", total: "40", percentage: "87%" },
    { subject: "Physics", attended: "32", total: "40", percentage: "80%" },
    { subject: "Chemistry", attended: "34", total: "40", percentage: "85%" },
  ],
  "child-2": [
    { subject: "Mathematics", attended: "37", total: "40", percentage: "92%" },
    { subject: "Science", attended: "36", total: "40", percentage: "90%" },
    { subject: "English", attended: "35", total: "40", percentage: "87%" },
  ],
};

export const performanceByChild: Record<string, PerformanceSubject[]> = {
  "child-1": [
    {
      id: "mathematics",
      name: "Mathematics",
      score: "88%",
      teacher: "Ms. Kavya Sharma",
      report: [
        "Strong algebra and coordinate geometry performance.",
        "Needs more timed practice for multi-step problem solving.",
        "Consistent class participation and homework completion.",
      ],
      syllabus: [
        "Linear equations and inequalities",
        "Quadratic expressions",
        "Coordinate geometry",
        "Statistics and probability fundamentals",
      ],
    },
    {
      id: "physics",
      name: "Physics",
      score: "82%",
      teacher: "Mr. Arjun Verma",
      report: [
        "Understands core mechanics concepts clearly.",
        "Numerical accuracy drops in longer derivation questions.",
        "Lab observation quality is improving steadily.",
      ],
      syllabus: [
        "Motion and laws of force",
        "Work, energy, and power",
        "Heat and thermal effects",
        "Light and basic optics",
      ],
    },
    {
      id: "chemistry",
      name: "Chemistry",
      score: "90%",
      teacher: "Ms. Nisha Rao",
      report: [
        "Excellent retention of reactions and balancing methods.",
        "Performs especially well in chapter-end assessments.",
        "Should continue revising chemical equations weekly.",
      ],
      syllabus: [
        "Atomic structure",
        "Chemical reactions and equations",
        "Acids, bases, and salts",
        "Metals and non-metals",
      ],
    },
  ],
  "child-2": [
    {
      id: "mathematics",
      name: "Mathematics",
      score: "91%",
      teacher: "Ms. Sneha Joshi",
      report: [
        "Works neatly and solves application questions with confidence.",
        "Can stretch further with weekly olympiad practice.",
        "Maintains steady improvement in revision tests.",
      ],
      syllabus: [
        "Rational numbers",
        "Linear equations in one variable",
        "Understanding quadrilaterals",
        "Practical geometry",
      ],
    },
    {
      id: "science",
      name: "Science",
      score: "86%",
      teacher: "Mr. Rohit Nair",
      report: [
        "Performs well in concept checks and classroom experiments.",
        "Should revise definitions before unit tests.",
        "Shows curiosity during lab-based discussions.",
      ],
      syllabus: [
        "Crop production and management",
        "Microorganisms",
        "Combustion and flame",
        "Conservation of plants and animals",
      ],
    },
    {
      id: "english",
      name: "English",
      score: "89%",
      teacher: "Mrs. Pooja Sharma",
      report: [
        "Reads fluently and writes structured answers.",
        "Grammar accuracy has improved in recent assessments.",
        "Can gain more marks by expanding long-form responses.",
      ],
      syllabus: [
        "Story comprehension",
        "Grammar and editing",
        "Paragraph writing",
        "Poetry interpretation",
      ],
    },
  ],
};

export const feeTransactionsByChild: Record<string, FeeTransaction[]> = {
  "child-1": [
    { month: "January 2026", amount: "Rs. 12,000", status: "Paid", date: "2026-01-05" },
    { month: "February 2026", amount: "Rs. 12,000", status: "Paid", date: "2026-02-04" },
    { month: "March 2026", amount: "Rs. 12,000", status: "Pending", date: "Due 2026-03-15" },
  ],
  "child-2": [
    { month: "January 2026", amount: "Rs. 9,500", status: "Paid", date: "2026-01-06" },
    { month: "February 2026", amount: "Rs. 9,500", status: "Paid", date: "2026-02-06" },
    { month: "March 2026", amount: "Rs. 9,500", status: "Paid", date: "2026-03-07" },
  ],
};

export const facultyContactsByChild: Record<string, FacultyContact[]> = {
  "child-1": [
    { subject: "Mathematics", faculty: "Ms. Kavya Sharma", phone: "+91 98765 43210" },
    { subject: "Physics", faculty: "Mr. Arjun Verma", phone: "+91 99887 76655" },
    { subject: "Chemistry", faculty: "Ms. Nisha Rao", phone: "+91 91234 56789" },
    { subject: "Class Teacher", faculty: "Mrs. Deepa Menon", phone: "+91 90001 23456" },
  ],
  "child-2": [
    { subject: "Mathematics", faculty: "Ms. Sneha Joshi", phone: "+91 98888 12001" },
    { subject: "Science", faculty: "Mr. Rohit Nair", phone: "+91 97777 44012" },
    { subject: "English", faculty: "Mrs. Pooja Sharma", phone: "+91 96666 55123" },
    { subject: "Class Teacher", faculty: "Ms. Rekha Soni", phone: "+91 95555 33210" },
  ],
};

export const getChildProfileById = (childId: string) => {
  return childProfiles.find((child) => child.id === childId) || childProfiles[0];
};

export const getAttendanceForChild = (childId: string) => {
  return attendanceByChild[childId] || attendanceByChild[childProfiles[0].id];
};

export const getPerformanceForChild = (childId: string) => {
  return performanceByChild[childId] || performanceByChild[childProfiles[0].id];
};

export const getFeesForChild = (childId: string) => {
  return feeTransactionsByChild[childId] || feeTransactionsByChild[childProfiles[0].id];
};

export const getFacultyContactsForChild = (childId: string) => {
  return facultyContactsByChild[childId] || facultyContactsByChild[childProfiles[0].id];
};
