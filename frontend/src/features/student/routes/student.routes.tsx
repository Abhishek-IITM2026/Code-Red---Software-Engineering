import StudentDashboard from "../pages/StudentDashboard";
import StudentLeave from "../pages/StudentLeave";
import UpcomingCourses from "../pages/UpcomingCourses";
import ViewSchedule from "../pages/ViewSchedule";
import { FiCheckCircle, FiFileText, FiCalendar, FiBook, FiGrid, FiAward, FiUser, FiClock } from "react-icons/fi";
import StudentAttendance from "../pages/StudentAttendance";
import StudentMarks from "../pages/StudentMarks";
import StudentSubjects from "../pages/StudentSubjects";
import SubjectDetails from "../pages/SubjectDetails";
import AssignmentDetails from "../pages/AssignmentDetails";
import Profile from "../../auth/pages/Profile";

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
    path: "/student/subjects/:subjectName/:section",
    element: <SubjectDetails />,
    icon: FiBook,
    description: "View subject details"
  },
  {
    name: "Assignment Details",
    path: "/student/assignments/:assignmentId",
    element: <AssignmentDetails />,
    icon: FiFileText,
    description: "View and submit assignment"
  },
  {
    name: "Upcoming Courses",
    path: "/student/upcoming-courses",
    element: <UpcomingCourses />,
    icon: FiCalendar,
    description: "View upcoming courses for your class"
  },
  {
    name: "Class Schedule",
    path: "/student/schedule",
    element: <ViewSchedule />,
    icon: FiCalendar,
    description: "View class timetable"
  },
  {
    name: "Apply Leave",
    path: "/student/leave",
    element: <StudentLeave />,
    icon: FiClock,
    description: "Submit leave requests to administration"
  },
  {
    name: "My Profile",
    path: "/student/profile",
    element: <Profile />,
    icon: FiUser,
    description: "Manage your student profile"
  }
];

export default studentRoutes;
