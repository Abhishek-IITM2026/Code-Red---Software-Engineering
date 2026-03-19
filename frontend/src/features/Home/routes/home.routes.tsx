import About from "../pages/About";
import Contact from "../pages/Contact";
import Courses from "../pages/Courses";
import Features from "../pages/Features";
import Landing from "../pages/Landing";
import { FiBook, FiHome, FiInfo, FiMail, FiStar } from "react-icons/fi";

export interface HomeRouteConfig {
  name: string;
  path: string;
  element: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

const homeRoutes: HomeRouteConfig[] = [
  {
    name: "Home",
    path: "/",
    element: <Landing />,
    icon: FiHome
  },
  {
    name: "About",
    path: "/about",
    element: <About />,
    icon: FiInfo
  },
  {
    name: "Features",
    path: "/features",
    element: <Features />,
    icon: FiStar
  },
  {
    name: "Courses",
    path: "/courses",
    element: <Courses />,
    icon: FiBook
  },
  {
    name: "Contact",
    path: "/contact",
    element: <Contact />,
    icon: FiMail
  }
];

export default homeRoutes;
