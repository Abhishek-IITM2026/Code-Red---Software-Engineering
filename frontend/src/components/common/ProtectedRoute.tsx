import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const roleRedirects: Record<string, string> = {
  student: '/student/dashboard',
  faculty: '/faculty/dashboard',
  parent: '/parent/dashboard',
  administration: '/administration/dashboard',
  admin: '/administration/dashboard'
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);

  // Check if user is authenticated
  if (!isAuthenticated || !token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase() || '';
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      const redirectPath = roleRedirects[userRole] || '/auth/login';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

// Helper hook for getting redirect path based on role
export const useRoleRedirect = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  const getDefaultRoute = (): string => {
    if (!user) return '/auth/login';
    const role = user.role?.toLowerCase();
    return roleRedirects[role || ''] || '/auth/login';
  };

  const getHomeRoute = (): string => {
    return getDefaultRoute();
  };

  return { getDefaultRoute, getHomeRoute };
};

export default ProtectedRoute;
