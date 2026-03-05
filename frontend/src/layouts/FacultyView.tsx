import { Outlet, Link } from "react-router-dom"
const FacultyView = function(){
    return (
        <div>
            <h1>FacultyView Page</h1>
            <Outlet />
        </div>
    )
}

export default FacultyView