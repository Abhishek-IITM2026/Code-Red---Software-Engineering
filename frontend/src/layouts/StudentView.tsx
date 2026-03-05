import { Outlet, Link } from "react-router-dom"

const StudentView = function(){
    return (
        <div>

            <h1>StudentView Page</h1>
            <ul>
                <li>
                    <Link to="/student/dashboard">Student Dashboard</Link>
                </li>
            </ul>
            <Outlet />
        </div>
    )
}

export default StudentView