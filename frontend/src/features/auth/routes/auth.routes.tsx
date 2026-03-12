import Login from "../pages/Login";
import Register from "../pages/Register";
import { FiLogIn, FiUserPlus } from "react-icons/fi";

export interface AuthRouteConfig {
  name: string;
  path: string;
  element: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

const authRoutes: AuthRouteConfig[] = [
  {
    name: "Login",
    path: "login",
    element: <Login />,
    icon: FiLogIn
  },
  {
    name: "Register",
    path: "register",
    element: <Register />,
    icon: FiUserPlus
  }
];

export default authRoutes;
