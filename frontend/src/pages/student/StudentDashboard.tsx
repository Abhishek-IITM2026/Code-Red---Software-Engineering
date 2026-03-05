import { Outlet } from "react-router-dom"

const StudentDashboard = function(){
    return (
        <div>
            <h1>StudentDashboard Page</h1>
            <Outlet />
        </div>
    )
}

export default StudentDashboard