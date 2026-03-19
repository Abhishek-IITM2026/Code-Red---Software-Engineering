import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App";
import HomeLayout from "../features/Home/layout/HomeLayout";
import AuthLayout from "../features/auth/layout/AuthLayout";
import StudentLayout from "../features/student/layout/StudentLayout";
import FacultyLayout from "../features/faculty/layout/FacultyLayout";
import ParentLayout from "../features/parent/layout/ParentLayout";
import AdministrationLayout from "../features/administration/layout/AdministrationLayout";
import Profile from "../features/auth/pages/Profile";

// Children Routes for different roles
import homeRoutes from "../features/Home/routes/home.routes";
import studentRoutes from "../features/student/routes/student.routes";
import authRoutes from "../features/auth/routes/auth.routes";
import facultyRoutes from "../features/faculty/routes/faculty.routes";
import parentRoutes from "../features/parent/routes/parent.routes";
import administrationRoutes from "../features/administration/routes/administration.routes";

// Protected Route wrapper component
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import React from "react";

// Role-based redirect mapping
const roleRedirects: Record<string, string> = {
  student: "/student/dashboard",
  faculty: "/faculty/dashboard",
  parent: "/parent/dashboard",
  admin: "/administration/dashboard",
  administration: "/administration/dashboard",
  director: "/administration/dashboard",
  superadmin: "/administration/dashboard",
  "super admin": "/administration/dashboard",
};

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  
  if (!isAuthenticated || !token) {
    return <Navigate to="/auth/login" replace />;
  }
  
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase();
    if (!userRole || !allowedRoles.includes(userRole)) {
      const redirectPath = user ? roleRedirects[user.role?.toLowerCase() || ''] || "/auth/login" : "/auth/login";
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  return <>{children}</>;
};

// Login redirect component - redirects authenticated users to their dashboard
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  
  if (isAuthenticated && user) {
    const redirectPath = roleRedirects[user.role?.toLowerCase() || ''] || "/student/dashboard";
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Public Home Page
      {
        element: <HomeLayout />,
        children: homeRoutes
      },
      
      // Auth Routes (redirects if already logged in)
      {
        path: "auth",
        element: (
          <AuthGuard>
            <AuthLayout />
          </AuthGuard>
        ),
        children: authRoutes.map(route => ({
          index: route.path === "login",
          path: route.path,
          element: route.element
        }))
      },
      
      // Profile Route (Protected - accessible to all authenticated users)
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <AuthLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: "",
            element: <Profile />
          }
        ]
      },
      
      // Student Routes (Protected)
      {
        path: "/student",
        element: (
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout />
          </ProtectedRoute>
        ),
        children: studentRoutes.map((route, index) => ({
          index: index === 0,
          path: route.path.replace("/student/", ""),
          element: route.element
        }))
      },
      
      // Faculty Routes (Protected)
      {
        path: "/faculty",
        element: (
          <ProtectedRoute allowedRoles={["faculty", "teacher"]}>
            <FacultyLayout />
          </ProtectedRoute>
        ),
        children: facultyRoutes.map((route, index) => ({
          index: index === 0,
          path: route.path.replace("/faculty/", ""),
          element: route.element
        }))
      },
      
      // Parent Routes (Protected)
      {
        path: "/parent",
        element: (
          <ProtectedRoute allowedRoles={["parent"]}>
            <ParentLayout />
          </ProtectedRoute>
        ),
        children: parentRoutes.map((route, index) => ({
          index: index === 0,
          path: route.path.replace("/parent/", ""),
          element: route.element
        }))
      },
      
      // Administration Routes (Protected)
      {
        path: "/administration",
        element: (
          <ProtectedRoute allowedRoles={["admin", "administration", "superadmin", "super admin", "director"]}>
            <AdministrationLayout />
          </ProtectedRoute>
        ),
        children: administrationRoutes.map((route, index) => ({
          index: index === 0,
          path: route.path.replace("/administration/", ""),
          element: route.element
        }))
      },
      
      // Catch all - redirect to home
      {
        path: "*",
        element: <Navigate to="/" replace />
      }
    ]
  }
]);

export default router;

// Export role redirect utilities
export { roleRedirects };
