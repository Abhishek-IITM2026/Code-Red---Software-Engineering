import { Outlet, Link } from "react-router-dom"

const Auth = function () {

    return (
        <div>
            <h1>Auth Page</h1>
            <div>
                <ul>
                    <li>
                        <Link to="/auth/login">Login</Link>
                    </li>
                    <li>
                        <Link to="/auth/register">Register</Link>
                    </li>
                </ul>
            </div>
            <Outlet />
        </div>
    )
}

export default Auth