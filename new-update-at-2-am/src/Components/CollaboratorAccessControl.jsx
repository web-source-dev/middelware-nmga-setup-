import React from 'react';
import { useAuth } from '../middleware/auth';
import { 
  Box, 
  Typography, 
  Alert, 
  Card, 
  CardContent,
  Button
} from '@mui/material';
import { 
  Security as SecurityIcon,
  Lock as LockIcon,
  PersonOff as PersonOffIcon
} from '@mui/icons-material';

// Component to conditionally render content based on collaborator role
export const CollaboratorAccessControl = ({ 
  children, 
  requiredRoles, 
  fallback = null,
  showAccessDenied = true 
}) => {
    const { hasCollaboratorRole, isCollaborator, isAdmin, isImpersonating, collaboratorRole } = useAuth();
  
  // If not a collaborator (main account owner), always allow access
  if (!isCollaborator || collaboratorRole === 'viewer') {
    return children;
  }
  
  // If admin is impersonating, always allow access
  if (isAdmin && isImpersonating) {
    return children;
  }
  
  // Check if user has required role(s)
  const hasAccess = hasCollaboratorRole(requiredRoles);
  
  if (hasAccess) {
    return children;
  }
  
  if (!showAccessDenied) {
    return fallback;
  }
  
  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 2 }}>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <LockIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          You don't have the required permissions to access this feature.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Required roles: {Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Component to show collaborator status and role
export const CollaboratorStatus = () => {
  const { 
    isCollaborator, 
    collaboratorRole, 
    collaboratorEmail,
    isCollaboratorManager,
    isDealManager,
    isSupplierManager,
    isMediaManager,
    isCommitmentManager,
    isSubstoreManager
  } = useAuth();
  
  if (!isCollaborator) {
    return null;
  }
  
  const getRoleColor = (role) => {
    switch (role) {
      case 'manager': return 'error';
      case 'deal_manager': return 'primary';
      case 'supplier_manager': return 'secondary';
      case 'media_manager': return 'info';
      case 'commitment_manager': return 'warning';
      case 'substore_manager': return 'success';
      case 'viewer': return 'default';
      default: return 'default';
    }
  };
  
  const getRoleLabel = (role) => {
    switch (role) {
      case 'manager': return 'Manager';
      case 'deal_manager': return 'Deal Manager';
      case 'supplier_manager': return 'Supplier Manager';
      case 'media_manager': return 'Media Manager';
      case 'commitment_manager': return 'Commitment Manager';
      case 'substore_manager': return 'Substore Manager';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };
  
  return (
    <Alert 
      severity="info" 
      icon={<SecurityIcon />}
      sx={{ mb: 2 }}
    >
      <Typography variant="body2">
        <strong>Collaborator Access:</strong> {getRoleLabel(collaboratorRole)} 
        {collaboratorEmail && ` (${collaboratorEmail})`}
      </Typography>
    </Alert>
  );
};

// Component to show access denied message for non-collaborators
export const CollaboratorOnlyAccess = ({ children, showMessage = true }) => {
  const { isCollaborator } = useAuth();
  
  if (isCollaborator) {
    return children;
  }
  
  if (!showMessage) {
    return null;
  }
  
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <PersonOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Collaborator Access Required
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        This feature is only available to team members with collaborator access.
      </Typography>
    </Box>
  );
};

// Component to show role-specific access denied
export const RoleAccessDenied = ({ requiredRole, currentRole }) => {
  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 2 }}>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <LockIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Insufficient Permissions
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Your current role ({currentRole}) doesn't have access to this feature.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Required role: {requiredRole}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Higher-order component for role-based access control
export const withCollaboratorAccess = (Component, requiredRoles) => {
  return (props) => {
    const { hasCollaboratorRole, isCollaborator } = useAuth();
    
    if (!isCollaborator) {
      return <CollaboratorOnlyAccess />;
    }
    
    if (!hasCollaboratorRole(requiredRoles)) {
      return <RoleAccessDenied 
        requiredRole={Array.isArray(requiredRoles) ? requiredRoles.join(' or ') : requiredRoles}
        currentRole={props.collaboratorRole}
      />;
    }
    
    return <Component {...props} />;
  };
};

// Utility component to conditionally show/hide elements based on role
export const RoleBasedRender = ({ 
  children, 
  roles, 
  fallback = null,
  inverse = false 
}) => {
  const { hasCollaboratorRole, isCollaborator } = useAuth();
  
  if (!isCollaborator) {
    return inverse ? children : fallback;
  }
  
  const hasAccess = hasCollaboratorRole(roles);
  const shouldShow = inverse ? !hasAccess : hasAccess;
  
  return shouldShow ? children : fallback;
};

export default {
  CollaboratorAccessControl,
  CollaboratorStatus,
  CollaboratorOnlyAccess,
  RoleAccessDenied,
  withCollaboratorAccess,
  RoleBasedRender
};
