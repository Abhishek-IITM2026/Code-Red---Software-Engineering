import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import AuthView from "../layouts/AuthView";
import Login from "../features/auth/components/Login";
import Register from "../features/auth/components/Register";
import StudentView from "../layouts/StudentView";
import FacultyView from "../layouts/FacultyView";
import ParentView from "../layouts/ParentView";
import DirectorView from "../layouts/DirectorView";

// Children Routes for diffent roles
import studentRoutes from "../routes/student"; 




const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    children:[
      {
        path: "auth",
        element: <AuthView />,
        children:[
          {
            path: "/auth/login",
            element: <Login/>,
          },
          {
            path: "/auth/register",
            element: <Register/>,
          }
        ]
      },
      {
        path: "/student",
        element: <StudentView />,
        children: studentRoutes
      },
      {
        path: "/faculty",
        element: <FacultyView />
      },
      {
        path: "/parent",
        element: <ParentView />
      },
      {
        path: "/director",
        element: <DirectorView />
      },
      
    ]
  }
]);


export default router