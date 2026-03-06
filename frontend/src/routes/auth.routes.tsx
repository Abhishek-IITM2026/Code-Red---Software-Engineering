import { Navigate } from "react-router-dom"
import AuthView from "../layouts/AuthView"
import Login from "../features/auth/components/Login"
import Register from "../features/auth/components/Register"

const authRoutes = [
      {
        path: "/auth/login",
        element: <Login />,
      },
      {
        path: "/auth/register",
        element: <Register />,
      },
    ]

export default authRoutes
