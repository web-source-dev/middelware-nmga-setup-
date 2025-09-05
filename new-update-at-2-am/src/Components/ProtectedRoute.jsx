import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../middleware/auth';

const ProtectedRoute = ({ 
  children, 
  requireAuth: needsAuth = true, 
  requireAdmin = false, 
  requireDistributorAdmin = false, 
  requireMemberAdmin = false,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, isAdmin, isDistributor, isMember, isImpersonating } = useAuth();
  const location = useLocation();

  // If authentication is not required, render children
  if (!needsAuth) {
    return children;
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check distributor/admin requirement
  if (requireDistributorAdmin && !isDistributor && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check member/admin requirement
  if (requireMemberAdmin && !isMember && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed, render children
  return children;
};

export default ProtectedRoute;
