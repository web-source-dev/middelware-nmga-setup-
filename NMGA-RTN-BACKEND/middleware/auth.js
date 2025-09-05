const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Basic authentication middleware - checks if user is authenticated
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        success: false 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found.',
        success: false 
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        message: 'User is blocked.',
        success: false 
      });
    }

    // If admin is logged in as another user, set the impersonated user info
    if (decoded.impersonatedUserId) {
      const impersonatedUser = await User.findById(decoded.impersonatedUserId);
      if (impersonatedUser) {
        // Set the impersonated user as the current user
        req.user = {
          id: impersonatedUser._id,
          role: impersonatedUser.role,
          email: impersonatedUser.email,
          name: impersonatedUser.name
        };
        
        // Set the admin info as the original user
        const adminUser = await User.findById(decoded.adminId);
        if (adminUser) {
          req.originalUser = {
            id: adminUser._id,
            role: adminUser.role,
            email: adminUser.email,
            name: adminUser.name
          };
        }
        
        req.impersonatedUser = {
          id: impersonatedUser._id,
          role: impersonatedUser.role,
          email: impersonatedUser.email,
          name: impersonatedUser.name
        };
        // Store the admin's ID from the token
        req.adminId = decoded.adminId;
      }
    } else {
      // Regular login - set user info in request
      req.user = {
        id: user._id,
        role: user.role,
        email: user.email,
        name: user.name
      };
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      message: 'Invalid token.',
      success: false 
    });
  }
};

// Admin only middleware
const isAdmin = async (req, res, next) => {
  try {
    // Call isAuthenticated and wait for it to complete
    await new Promise((resolve, reject) => {
      isAuthenticated(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.',
        success: false 
      });
    }

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({ 
      message: 'Authentication failed.',
      success: false 
    });
  }
};

// Distributor and Admin access middleware
const isDistributorAdmin = async (req, res, next) => {
  try {
    // Call isAuthenticated and wait for it to complete
    await new Promise((resolve, reject) => {
      isAuthenticated(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Check if this is an impersonation scenario
    if (req.impersonatedUser) {
      // Admin is impersonating another user
      if (req.impersonatedUser.role === 'distributor') {
        req.currentUser = req.impersonatedUser;
        req.isImpersonating = true;
        next();
        return;
      } else {
        // Admin is impersonating a non-distributor user
        return res.status(403).json({ 
          message: 'Access denied. Distributor privileges required.',
          success: false 
        });
      }
    }
    
    // Regular access - user must be distributor or admin
    if (req.user.role !== 'distributor' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Distributor or Admin privileges required.',
        success: false 
      });
    }

    req.currentUser = req.user;
    req.isImpersonating = false;
    next();
  } catch (error) {
    console.error('Distributor/Admin authentication error:', error);
    return res.status(401).json({ 
      message: 'Authentication failed.',
      success: false 
    });
  }
};

// Member and Admin access middleware
const isMemberAdmin = async (req, res, next) => {
  try {
    // Call isAuthenticated and wait for it to complete
    await new Promise((resolve, reject) => {
      isAuthenticated(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Check if this is an impersonation scenario
    if (req.impersonatedUser) {
      // Admin is impersonating another user
      if (req.impersonatedUser.role === 'member') {
        req.currentUser = req.impersonatedUser;
        req.isImpersonating = true;
        next();
        return;
      } else {
        // Admin is impersonating a non-member user
        return res.status(403).json({ 
          message: 'Access denied. Member privileges required.',
          success: false 
        });
      }
    }
    
    // Regular access - user must be member or admin
    if (req.user.role !== 'member' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Member or Admin privileges required.',
        success: false 
      });
    }

    req.currentUser = req.user;
    req.isImpersonating = false;
    next();
  } catch (error) {
    console.error('Member/Admin authentication error:', error);
    return res.status(401).json({ 
      message: 'Authentication failed.',
      success: false 
    });
  }
};

// Get current user context (useful for determining if admin is impersonating)
const getCurrentUserContext = (req) => {
  if (req.impersonatedUser) {
    // When admin is impersonating, we need to get the admin's info
    return {
      currentUser: req.impersonatedUser,
      originalUser: req.originalUser || req.user, // Use originalUser if available (admin info)
      isImpersonating: true,
      adminId: req.adminId
    };
  }
  
  return {
    currentUser: req.user,
    isImpersonating: false
  };
};

module.exports = {
  isAuthenticated,
  isAdmin,
  isDistributorAdmin,
  isMemberAdmin,
  getCurrentUserContext
};
