import Landing from "../pages/Landing";
import { FiHome, FiInfo, FiStar } from "react-icons/fi";

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
  }
];

export default homeRoutes;
