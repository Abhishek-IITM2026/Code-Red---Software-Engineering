import ParentDashboard from "../pages/parent/ParentDashboard";
import ViewAttendanceUpdates from "../pages/parent/ViewAttendanceUpdates";
import ViewPerformanceReports from "../pages/parent/ViewPerformanceReports";
import ViewFeeDetails from "../pages/parent/ViewFeeDetails";
import ParentCommunication from "../pages/parent/ParentCommunication";


const parentRoutes = [
    {
        path: "/parent/dashboard",
        element: <ParentDashboard />
    },
    {
        path: "/parent/attendance-updates",
        element: <ViewAttendanceUpdates />
    },
    {
        path: "/parent/performance-reports",
        element: <ViewPerformanceReports />
    },
    {
        path: "/parent/fee-details",
        element: <ViewFeeDetails />
    },
    {
        path: "/parent/communication",
        element: <ParentCommunication />
    }
]

export default parentRoutes;