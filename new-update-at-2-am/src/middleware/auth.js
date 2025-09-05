import { getCurrentUserContext, isAuthenticated, isAdmin, isDistributor, isMember, isImpersonating } from '../services/api';

// Frontend middleware for route protection
export const requireAuth = (Component) => {
  return (props) => {
    if (!isAuthenticated()) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return null;
    }
    return <Component {...props} />;
  };
};

// Admin only route protection
export const requireAdmin = (Component) => {
  return (props) => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return null;
    }
    
    if (!isAdmin()) {
      // Redirect to unauthorized page or dashboard
      window.location.href = '/dashboard';
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Distributor and Admin route protection
export const requireDistributorAdmin = (Component) => {
  return (props) => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return null;
    }
    
    const userContext = getCurrentUserContext();
    const isDistributorUser = isDistributor();
    const isAdminUser = isAdmin();
    
    if (!isDistributorUser && !isAdminUser) {
      window.location.href = '/dashboard';
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Member and Admin route protection
export const requireMemberAdmin = (Component) => {
  return (props) => {
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return null;
    }
    
    const userContext = getCurrentUserContext();
    const isMemberUser = isMember();
    const isAdminUser = isAdmin();
    
    if (!isMemberUser && !isAdminUser) {
      window.location.href = '/dashboard';
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Higher-order component for impersonation context
export const withImpersonationContext = (Component) => {
  return (props) => {
    const userContext = getCurrentUserContext();
    
    // Pass impersonation context to the component
    const enhancedProps = {
      ...props,
      userContext,
      isImpersonating: isImpersonating(),
      currentUserId: userContext.isImpersonating ? userContext.impersonatedUserId : userContext.user?.id,
      originalUserId: userContext.isImpersonating ? userContext.adminId : userContext.user?.id
    };
    
    return <Component {...enhancedProps} />;
  };
};

// Hook for getting current user context
export const useAuth = () => {
  const userContext = getCurrentUserContext();
  
  return {
    ...userContext,
    isAuthenticated: isAuthenticated(),
    isAdmin: isAdmin(),
    isDistributor: isDistributor(),
    isMember: isMember(),
    isImpersonating: isImpersonating(),
    currentUserId: userContext.isImpersonating ? userContext.impersonatedUserId : userContext.user?.id,
    originalUserId: userContext.isImpersonating ? userContext.adminId : userContext.user?.id,
    userRole: userContext.user?.role
  };
};

// Utility function to check if user can access a specific feature
export const canAccess = (requiredRole, allowImpersonation = true) => {
  const userContext = getCurrentUserContext();
  
  if (!isAuthenticated()) {
    return false;
  }
  
  // If admin is impersonating and impersonation is allowed
  if (allowImpersonation && userContext.isImpersonating) {
    // Check if the impersonated user has the required role
    return userContext.user?.role === requiredRole;
  }
  
  // Check if the current user has the required role
  return userContext.user?.role === requiredRole;
};

// Utility function to get the effective user ID (impersonated or current)
export const getEffectiveUserId = () => {
  const userContext = getCurrentUserContext();
  return userContext.isImpersonating ? userContext.impersonatedUserId : userContext.user?.id;
};

// Utility function to get the effective user role (impersonated or current)
export const getEffectiveUserRole = () => {
  const userContext = getCurrentUserContext();
  return userContext.user?.role;
};
