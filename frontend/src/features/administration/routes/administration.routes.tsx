import AdministrationDashboard from "../pages/AdministrationDashboard";
import AISettings from "../pages/AISettings";
import AuthorityManagement from "../pages/AuthorityManagement";
import CourseManagement from "../pages/CourseManagement";
import FinancialRecords from "../pages/FinancialRecords";
import GenerateReports from "../pages/GenerateReports";
import LeaveManagement from "../pages/LeaveManagement";
import ManageStaffRecords from "../pages/ManageStaffRecords";
import ManageStudentRecords from "../pages/ManageStudentRecords";
import MonitorPerformanceTrends from "../pages/MonitorPerformanceTrends";
import PromoteStudents from "../pages/PromoteStudents";
import ViewConsolidatedAttendanceReports from "../pages/ViewConsolidatedAttendanceReports";
import ViewExamParticipationReports from "../pages/ViewExamParticipationReports";
import InventoryDashboard from "../pages/Inventory/InventoryDashboard";
import RequestManagement from "../pages/Inventory/RequestManagement";
import ScheduleManagement from "../pages/ScheduleManagement";
import SalarySlips from "../pages/SalarySlips";
import AdminMySalarySlip from "../pages/AdminMySalarySlip";
import Profile from "../../auth/pages/Profile";
import {
  FiArrowUpCircle,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiBookOpen,
  FiCheckSquare,
  FiClock,
  FiCpu,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiGrid,
  FiPackage,
  FiShield,
  FiShoppingCart,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import type { AuthorityKey } from "../utils/authorityAccess";

export interface AdminRouteConfig {
  name: string;
  path: string;
  element: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  requiredAuthorities?: AuthorityKey[];
}

const administrationRoutes: AdminRouteConfig[] = [
  {
    name: "Dashboard",
    path: "/administration/dashboard",
    element: <AdministrationDashboard />,
    icon: FiGrid,
    description: "Institute overview and quick actions"
  },
  {
    name: "Authority Control",
    path: "/administration/authority-management",
    element: <AuthorityManagement />,
    icon: FiShield,
    description: "Assign role-based approval authorities to staff"
  },
  {
    name: "Course Management",
    path: "/administration/course-management",
    element: <CourseManagement />,
    icon: FiBookOpen,
    description: "Create upcoming courses for students"
  },
  {
    name: "AI Settings",
    path: "/administration/ai-settings",
    element: <AISettings />,
    icon: FiCpu,
    description: "Manage assessment AI provider, model, and rate controls"
  },
  {
    name: "Student Records",
    path: "/administration/student-records",
    element: <ManageStudentRecords />,
    icon: FiUsers,
    description: "Manage student information"
  },
  {
    name: "Promote Students",
    path: "/administration/promote-students",
    element: <PromoteStudents />,
    icon: FiArrowUpCircle,
    description: "Promote students to next class",
    requiredAuthorities: ["studentPromotion"],
  },
  {
    name: "Staff Records",
    path: "/administration/staff-records",
    element: <ManageStaffRecords />,
    icon: FiBriefcase,
    description: "Manage teaching and non-teaching staff records",
    requiredAuthorities: ["staffCreation"],
  },
  {
    name: "Financial Records",
    path: "/administration/financial-records",
    element: <FinancialRecords />,
    icon: FiCreditCard,
    description: "Review staff salary and increment records"
  },
  {
    name: "Salary Slips",
    path: "/administration/salary-slips",
    element: <SalarySlips />,
    icon: FiDollarSign,
    description: "Review monthly salary slips with leave and overtime impact"
  },
  {
    name: "My Salary Slip",
    path: "/administration/my-salary-slip",
    element: <AdminMySalarySlip />,
    icon: FiDollarSign,
    description: "Open your ESS-style salary slip with previous-year access"
  },
  {
    name: "Leave Management",
    path: "/administration/leave-management",
    element: <LeaveManagement />,
    icon: FiClock,
    description: "Approve or reject student and faculty leave requests",
    requiredAuthorities: ["leaveApproval"],
  },
  {
    name: "Financial Details",
    path: "/administration/financial-records/:staffId",
    element: <FinancialRecords />,
    icon: FiCreditCard,
    description: "Detailed staff financial profile"
  },
  {
    name: "Attendance Reports",
    path: "/administration/attendance-reports",
    element: <ViewConsolidatedAttendanceReports />,
    icon: FiCheckSquare,
    description: "View consolidated attendance"
  },
  {
    name: "Exam Reports",
    path: "/administration/exam-reports",
    element: <ViewExamParticipationReports />,
    icon: FiBarChart2,
    description: "View exam participation reports"
  },
  {
    name: "Performance Trends",
    path: "/administration/performance-trends",
    element: <MonitorPerformanceTrends />,
    icon: FiTrendingUp,
    description: "Monitor performance analytics"
  },
  {
    name: "Reports",
    path: "/administration/reports",
    element: <GenerateReports />,
    icon: FiFileText,
    description: "Generate various reports"
  },
  {
    name: "Inventory",
    path: "/administration/inventory",
    element: <InventoryDashboard />,
    icon: FiPackage,
    description: "Manage institute inventory"
  },
  {
    name: "Requests",
    path: "/administration/requests",
    element: <RequestManagement />,
    icon: FiShoppingCart,
    description: "Review faculty material requests"
  },
  {
    name: "Class Schedule",
    path: "/administration/schedule",
    element: <ScheduleManagement />,
    icon: FiCalendar,
    description: "Manage class lecture schedules"
  },
  {
    name: "My Profile",
    path: "/administration/profile",
    element: <Profile />,
    icon: FiUser,
    description: "Manage your admin profile"
  }
];

export default administrationRoutes;
