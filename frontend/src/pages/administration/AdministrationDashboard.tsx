import { Outlet } from "react-router-dom"

const AdministrationDashboard = function(){
    return (
        <div>
            <h1>Administration Dashboard Page</h1>
            <Outlet />
        </div>
    )
}

export default AdministrationDashboard;