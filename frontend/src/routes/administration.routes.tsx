import AdministrationDashboard from "../pages/administration/AdministrationDashboard";
import ManageStudentRecords from "../pages/administration/ManageStudentRecords";
import GenerateReports from "../pages/administration/GenerateReports";
import PromoteStudents from "../pages/administration/PromoteStudents";
import ViewConsolidatedAttendanceReports from "../pages/administration/ViewConsolidatedAttendanceReports";
import MonitorPerformanceTrends from "../pages/administration/MonitorPerformanceTrends";
import ViewExamParticipationReports from "../pages/administration/ViewExamParticipationReports";


const administrationRoutes = [
    {
        path: "/administration/dashboard",
        element: <AdministrationDashboard />
    },
    {
        path: "/administration/manage-students",
        element: <ManageStudentRecords />
    },
    {
        path: "/administration/generate-reports",
        element: <GenerateReports />
    },
    {
        path: "/administration/promote-students",
        element: <PromoteStudents />
    },
    {
        path: "/administration/attendance-reports",
        element: <ViewConsolidatedAttendanceReports />
    },
    {
        path: "/administration/performance-trends",
        element: <MonitorPerformanceTrends />
    },
    {
        path: "/administration/exam-participation",
        element: <ViewExamParticipationReports />
    }
]

export default administrationRoutes;