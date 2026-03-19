import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import { FiLogIn, FiUserPlus, FiUser } from "react-icons/fi";

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
  },
  {
    name: "Profile",
    path: "profile",
    element: <Profile />,
    icon: FiUser
  }
];

export default authRoutes;
