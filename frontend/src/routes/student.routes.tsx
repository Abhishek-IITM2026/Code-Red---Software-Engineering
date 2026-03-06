import StudentDashboard from "../pages/student/StudentDashboard";
import ViewAttendance from "../pages/student/ViewAttendance";
import ViewMarks from "../pages/student/ViewMarks";
import ViewSchedule from "../pages/student/ViewSchedule";
import AccessStudyMaterials from "../pages/student/AccessStudyMaterials";


const studentRoutes = [
    {
        path: "/student/dashboard",
        element: <StudentDashboard />
    },
    {
        path: "/student/attendance",
        element: <ViewAttendance />
    },
    {
        path: "/student/marks",
        element: <ViewMarks />
    },
    {
        path: "/student/schedule",
        element: <ViewSchedule />
    },
    {
        path: "/student/study-materials",
        element: <AccessStudyMaterials />
    }
]

export default studentRoutes;