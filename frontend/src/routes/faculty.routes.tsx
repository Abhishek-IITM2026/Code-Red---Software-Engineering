import FacultyDashboard from "../pages/faculty/FacultyDashboard";
import RecordAttendance from "../pages/faculty/RecordAttendance";
import UpdateMarks from "../pages/faculty/UpdateMarks";
import ViewStudentPerformance from "../pages/faculty/ViewStudentPerformance";


const facultyRoutes = [
    {
        path: "/faculty/dashboard",
        element: <FacultyDashboard />
    },
    {
        path: "/faculty/record-attendance",
        element: <RecordAttendance />
    },
    {
        path: "/faculty/update-marks",
        element: <UpdateMarks />
    },
    {
        path: "/faculty/student-performance",
        element: <ViewStudentPerformance />
    }
]

export default facultyRoutes;