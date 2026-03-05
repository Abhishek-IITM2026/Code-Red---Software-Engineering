import { Outlet, Link } from "react-router-dom"

const ParentView = function(){
    return (
        <div>
            <h1>ParentView Page</h1>
            <Outlet />
        </div>
    )
}

export default ParentView