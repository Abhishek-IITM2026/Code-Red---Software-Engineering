import FacultyDashboard from "../pages/FacultyDashboard";
import FacultyClasses from "../pages/FacultyClasses";
import FacultyAttendance from "../pages/FacultyAttendance";
import FacultyAssessments from "../pages/FacultyAssessments";
import FacultyMaterials from "../pages/FacultyMaterials";
import MarkAttendance from "../pages/MarkAttendance";
import RecordAttendance from "../pages/RecordAttendance";
import ViewStudentPerformance from "../pages/ViewStudentPerformance";
import ClassStudents from "../pages/ClassStudents";
import { FiGrid, FiBook, FiCheckCircle, FiFileText, FiUpload, FiUsers, FiBarChart2 } from "react-icons/fi";

export interface FacultyRouteConfig {
  name: string;
  path: string;
  element: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const facultyRoutes: FacultyRouteConfig[] = [
  {
    name: "Dashboard",
    path: "/faculty/dashboard",
    element: <FacultyDashboard />,
    icon: FiGrid,
    description: "Overview of your classes and activities"
  },
  {
    name: "My Classes",
    path: "/faculty/classes",
    element: <FacultyClasses />,
    icon: FiBook,
    description: "View and manage your classes"
  },
  {
    name: "Attendance",
    path: "/faculty/attendance",
    element: <FacultyAttendance />,
    icon: FiCheckCircle,
    description: "Track student attendance"
  },
  {
    name: "Mark Attendance",
    path: "/faculty/mark-attendance",
    element: <MarkAttendance />,
    icon: FiCheckCircle,
    description: "Mark daily attendance"
  },
  {
    name: "Assessments",
    path: "/faculty/assessments",
    element: <FacultyAssessments />,
    icon: FiFileText,
    description: "Create and manage assessments"
  },
  {
    name: "Study Materials",
    path: "/faculty/materials",
    element: <FacultyMaterials />,
    icon: FiUpload,
    description: "Upload study materials"
  },
  {
    name: "Student Performance",
    path: "/faculty/student-performance",
    element: <ViewStudentPerformance />,
    icon: FiBarChart2,
    description: "View student performance analytics"
  },
  {
    name: "Class Students",
    path: "/faculty/class-students",
    element: <ClassStudents />,
    icon: FiUsers,
    description: "View students in your classes"
  }
];

export default facultyRoutes;
