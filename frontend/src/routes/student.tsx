import { Navigate } from "react-router-dom"
import StudentDashboard from "../pages/student/StudentDashboard";


const studentRoutes = [
    {
        path:"/student/dashboard",
        element:<StudentDashboard />
    }
]

export default studentRoutes;