import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../../stores/auth.store.tsx';
import { usePermissions } from '../../hooks/usePermissions';
import { Spinner } from '../ui/Spinner';
import type { UserRole, PermissionKey } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requiredPermission?: PermissionKey;
}

export function ProtectedRoute({ allowedRoles, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const { isAdmin, hasPermission } = usePermissions();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Check permission-based access (admin always passes)
  if (requiredPermission && !isAdmin && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
