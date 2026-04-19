import AdministrationDashboard from "../pages/AdministrationDashboard";
import AISettings from "../pages/AISettings";
import AuthorityManagement from "../pages/AuthorityManagement";
import CourseManagement from "../pages/CourseManagement";
import FinancialRecords from "../pages/FinancialRecords";
import FinanceOperations from "../pages/FinanceOperations";
import LeaveManagement from "../pages/LeaveManagement";
import ManageStaffRecords from "../pages/ManageStaffRecords";
import ManageStudentRecords from "../pages/ManageStudentRecords";
import MonitorPerformanceTrends from "../pages/MonitorPerformanceTrends";
import PaymentDetails from "../pages/PaymentDetails";
import PromoteStudents from "../pages/PromoteStudents";
import InventoryDashboard from "../pages/Inventory/InventoryDashboard";
import ProcurementManagement from "../pages/Inventory/ProcurementManagement";
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
    name: "Finance Ops",
    path: "/administration/finance-operations",
    element: <FinanceOperations />,
    icon: FiCreditCard,
    description: "Approve salary account changes and export transaction ledgers",
  },
  {
    name: "Payment Details",
    path: "/administration/payment-details",
    element: <PaymentDetails />,
    icon: FiCreditCard,
    description: "View all payment-related transactions in one ledger",
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
    name: "Performance Trends",
    path: "/administration/performance-trends",
    element: <MonitorPerformanceTrends />,
    icon: FiTrendingUp,
    description: "Monitor class-wise exam performance and analytics"
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
    name: "Procurement",
    path: "/administration/procurement",
    element: <ProcurementManagement />,
    icon: FiShoppingCart,
    description: "Record vendor procurements and inventory expenses",
    requiredAuthorities: ["procurementManagement"],
  },
  {
    name: "Class Schedule",
    path: "/administration/schedule",
    element: <ScheduleManagement />,
    icon: FiCalendar,
    description: "Manage class lecture schedules",
    requiredAuthorities: ["scheduleCreation"],
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
