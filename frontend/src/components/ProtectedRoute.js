import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards a route behind auth + optional role check.
 * 
 * Props:
 *   element        — the component to render if access is granted
 *   requiredRole   — single role string (optional)
 *   requiredRoles  — array of allowed roles (optional)
 *
 * If both are omitted, any authenticated user can access.
 */
const ProtectedRoute = ({ element, requiredRole, requiredRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show nothing while auth state is being resolved
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in → redirect to login, remember where they came from
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Build the allowed roles list
  const allowedRoles = requiredRoles || (requiredRole ? [requiredRole] : null);

  // Role check: if roles are specified and user's role isn't in them → 403
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their correct dashboard
    const dashMap = {
      admin:    '/admin/dashboard',
      agent:    '/agent/dashboard',
      investor: '/investor/dashboard',
      user:     '/user/dashboard',
    };
    return <Navigate to={dashMap[user.role] || '/'} replace />;
  }

  return element;
};

export default ProtectedRoute;
