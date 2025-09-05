const express = require('express');
const router = express.Router();
const { 
  isAuthenticated, 
  isAdmin, 
  isDistributorAdmin, 
  isMemberAdmin,
  getCurrentUserContext 
} = require('../middleware/auth');

// Test route for basic authentication
router.get('/auth-test', isAuthenticated, (req, res) => {
  const userContext = getCurrentUserContext(req);
  res.json({
    message: 'Authentication successful',
    user: userContext.currentUser,
    isImpersonating: userContext.isImpersonating
  });
});

// Test route for admin only
router.get('/admin-test', isAdmin, (req, res) => {
  res.json({
    message: 'Admin access granted',
    user: req.user
  });
});

// Test route for distributor/admin access
router.get('/distributor-test', isDistributorAdmin, (req, res) => {
  const userContext = getCurrentUserContext(req);
  res.json({
    message: 'Distributor/Admin access granted',
    currentUser: userContext.currentUser,
    isImpersonating: userContext.isImpersonating,
    originalUser: userContext.originalUser
  });
});

// Test route for member/admin access
router.get('/member-test', isMemberAdmin, (req, res) => {
  const userContext = getCurrentUserContext(req);
  res.json({
    message: 'Member/Admin access granted',
    currentUser: userContext.currentUser,
    isImpersonating: userContext.isImpersonating,
    originalUser: userContext.originalUser,
    adminId: userContext.adminId,
    details: userContext.isImpersonating ? 
      `Admin ${userContext.originalUser?.name} (${userContext.originalUser?.email}) is impersonating ${userContext.currentUser?.name} (${userContext.currentUser?.email})` :
      `Regular access by ${userContext.currentUser?.name} (${userContext.currentUser?.email})`
  });
});

// Test route to get current user context
router.get('/context', isAuthenticated, (req, res) => {
  const userContext = getCurrentUserContext(req);
  res.json({
    message: 'User context retrieved',
    context: userContext,
    effectiveUserId: userContext.currentUser.id,
    effectiveUserRole: userContext.currentUser.role,
    isImpersonating: userContext.isImpersonating
  });
});

module.exports = router;
