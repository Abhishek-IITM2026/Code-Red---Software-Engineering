import { Outlet, Link } from "react-router-dom"

const DirectorView = function(){
    return (
        <div>
            <h1>DirectorView Page</h1>
            <Outlet />
        </div>
    )
}

export default DirectorView