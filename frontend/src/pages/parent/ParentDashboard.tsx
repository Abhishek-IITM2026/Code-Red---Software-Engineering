import { Outlet } from "react-router-dom"

const ParentDashboard = function(){
    return (
        <div>
            <h1>Parent Dashboard Page</h1>
            <Outlet />
        </div>
    )
}

export default ParentDashboard;