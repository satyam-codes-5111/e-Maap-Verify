import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, loading, getRoleRedirectPath } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full">
          <LoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (!user || !user.role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // User does not have authorization for this specific role route
    const targetPath = getRoleRedirectPath(user.role);
    if (!targetPath || targetPath === location.pathname || targetPath === '/login') {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
};
