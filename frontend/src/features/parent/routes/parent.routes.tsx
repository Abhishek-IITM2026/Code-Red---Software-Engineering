import ParentDashboard from "../pages/ParentDashboard";
import ParentAttendance from "../pages/ParentAttendance";
import ParentPerformance from "../pages/ParentPerformance";
import ParentFees from "../pages/ParentFees";
import ParentCommunication from "../pages/ParentCommunication";
import ParentSubjectReport from "../pages/ParentSubjectReport";
import ParentTimetable from "../pages/ParentTimetable";
import { FiGrid, FiCheckCircle, FiAward, FiDollarSign, FiMessageSquare, FiBookOpen, FiCalendar } from "react-icons/fi";

export interface ParentRouteConfig {
  name: string;
  path: string;
  element: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const parentRoutes: ParentRouteConfig[] = [
  {
    name: "Dashboard",
    path: "/parent/dashboard",
    element: <ParentDashboard />,
    icon: FiGrid,
    description: "Overview of your child's progress"
  },
  {
    name: "Attendance",
    path: "/parent/attendance",
    element: <ParentAttendance />,
    icon: FiCheckCircle,
    description: "View attendance records"
  },
  {
    name: "Performance",
    path: "/parent/performance",
    element: <ParentPerformance />,
    icon: FiAward,
    description: "View academic performance"
  },
  {
    name: "Fees",
    path: "/parent/fees",
    element: <ParentFees />,
    icon: FiDollarSign,
    description: "View fee details and payments"
  },
  {
    name: "Communication",
    path: "/parent/communication",
    element: <ParentCommunication />,
    icon: FiMessageSquare,
    description: "Communicate with teachers"
  },
  {
    name: "Subject Report",
    path: "/parent/subject-report",
    element: <ParentSubjectReport />,
    icon: FiBookOpen,
    description: "Detailed subject-wise reports"
  },
  {
    name: "Timetable",
    path: "/parent/timetable",
    element: <ParentTimetable />,
    icon: FiCalendar,
    description: "View class schedule"
  }
];

export default parentRoutes;
