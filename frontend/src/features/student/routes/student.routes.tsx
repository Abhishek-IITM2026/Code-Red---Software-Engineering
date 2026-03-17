import StudentDashboard from "../pages/StudentDashboard";
import ViewSchedule from "../pages/ViewSchedule";
import { FiCheckCircle, FiFileText, FiCalendar, FiBook, FiGrid, FiAward, FiDownload } from "react-icons/fi";
import StudentAttendance from "../pages/StudentAttendance";
import StudentMarks from "../pages/StudentMarks";
import StudentMaterials from "../pages/StudentMaterials";
import StudentSubjects from "../pages/StudentSubjects";
import SubjectDetails from "../pages/SubjectDetails";
import StudentAssignments from "../pages/StudentAssignments";
import AssignmentDetails from "../pages/AssignmentDetails";

export interface RouteConfig {
  name: string;
  path: string;
  element: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const studentRoutes: RouteConfig[] = [
  {
    name: "Dashboard",
    path: "/student/dashboard",
    element: <StudentDashboard />,
    icon: FiGrid,
    description: "Overview and quick access"
  },
  {
    name: "Attendance",
    path: "/student/attendance",
    element: <StudentAttendance />,
    icon: FiCheckCircle,
    description: "View your attendance records"
  },
  {
    name: "Marks & Results",
    path: "/student/marks",
    element: <StudentMarks />,
    icon: FiAward,
    description: "Check your exam marks"
  },
  {
    name: "Subjects",
    path: "/student/subjects",
    element: <StudentSubjects />,
    icon: FiBook,
    description: "Browse enrolled subjects"
  },
  {
    name: "Subject Details",
    path: "/student/subjects/:subjectName",
    element: <SubjectDetails />,
    icon: FiBook,
    description: "View subject details"
  },
  {
    name: "Assignments",
    path: "/student/assignments",
    element: <StudentAssignments />,
    icon: FiFileText,
    description: "View and submit assignments"
  },
  {
    name: "Assignment Details",
    path: "/student/assignments/:assignmentId",
    element: <AssignmentDetails />,
    icon: FiFileText,
    description: "View and submit assignment"
  },
  {
    name: "Class Schedule",
    path: "/student/schedule",
    element: <ViewSchedule />,
    icon: FiCalendar,
    description: "View class timetable"
  },
  {
    name: "Study Materials",
    path: "/student/materials",
    element: <StudentMaterials />,
    icon: FiDownload,
    description: "Access study resources"
  }
];

export default studentRoutes;
