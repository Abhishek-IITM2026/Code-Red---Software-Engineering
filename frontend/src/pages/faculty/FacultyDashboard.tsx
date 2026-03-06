import { Outlet } from "react-router-dom"

const FacultyDashboard = function(){
    return (
        <div>
            <h1>FacultyDashboard Page</h1>
            <Outlet />
        </div>
    )
}

export default FacultyDashboard;