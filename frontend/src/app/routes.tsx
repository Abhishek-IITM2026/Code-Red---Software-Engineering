import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import AuthView from "../layouts/AuthView";
import StudentView from "../layouts/StudentView";
import FacultyView from "../layouts/FacultyView";
import ParentView from "../layouts/ParentView";
import AdministrationView from "../layouts/AdministrationView";

// Children Routes for different roles
import studentRoutes from "../routes/student.routes";
import authRoutes from "../routes/auth.routes";
import facultyRoutes from "../routes/faculty.routes";
import parentRoutes from "../routes/parent.routes";
import administrationRoutes from "../routes/administration.routes";



const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children:[
      {
        path: "/",
        element: <Navigate to="/auth/login" replace />
      },
      {
        path: "auth",
        element: <AuthView />,
        children:authRoutes
      },
      {
        path: "/student",
        element: <StudentView />,
        children: studentRoutes
      },
      {
        path: "/faculty",
        element: <FacultyView />,
        children: facultyRoutes
      },
      {
        path: "/parent",
        element: <ParentView />,
        children: parentRoutes
      },
      {
        path: "/administration",
        element: <AdministrationView />,
        children: administrationRoutes
      },
      
    ]
  }
]);


export default router;
