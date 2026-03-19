import FacultyDashboard from "../pages/FacultyDashboard";
import FacultyLeave from "../pages/FacultyLeave";
import FacultyClasses from "../pages/FacultyClasses";
import FacultyAttendance from "../pages/FacultyAttendance";
import FacultyAssessments from "../pages/FacultyAssessments";
import FacultyMaterials from "../pages/FacultyMaterials";
import MarkAttendance from "../pages/MarkAttendance";
import RecordAttendance from "../pages/RecordAttendance";
import ViewStudentPerformance from "../pages/ViewStudentPerformance";
import ClassStudents from "../pages/ClassStudents";
import FacultySchedule from "../pages/FacultySchedule";
import AssessmentBuilder from "../pages/AssessmentBuilder";
import FacultySalarySlip from "../pages/FacultySalarySlip";
import Profile from "../../auth/pages/Profile";
import { FiGrid, FiBook, FiCheckCircle, FiFileText, FiUpload, FiUsers, FiBarChart2, FiCalendar, FiPlusCircle, FiUser, FiClock, FiDollarSign } from "react-icons/fi";

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
  },
  {
    name: "My Schedule",
    path: "/faculty/schedule",
    element: <FacultySchedule />,
    icon: FiCalendar,
    description: "View your teaching schedule"
  },
  {
    name: "Apply Leave",
    path: "/faculty/leave",
    element: <FacultyLeave />,
    icon: FiClock,
    description: "Submit leave requests to administration"
  },
  {
    name: "Salary Slip",
    path: "/faculty/salary-slip",
    element: <FacultySalarySlip />,
    icon: FiDollarSign,
    description: "Review monthly salary with leave and overtime adjustments"
  },
  {
    name: "Assessment Builder",
    path: "/faculty/assessment-builder",
    element: <AssessmentBuilder />,
    icon: FiPlusCircle,
    description: "Create AI-powered assessments"
  },
  {
    name: "My Profile",
    path: "/faculty/profile",
    element: <Profile />,
    icon: FiUser,
    description: "Manage your faculty profile"
  }
];

export default facultyRoutes;
