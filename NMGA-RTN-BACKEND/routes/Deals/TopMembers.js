const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Commitment = require('../../models/Commitments');
const Deal = require('../../models/Deals');
const { isAdmin, getCurrentUserContext } = require('../../middleware/auth');
const Log = require('../../models/Logs');

// Get all members (admin only)
router.get('/all-members/:userRole', isAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const adminId = currentUser.id;

    // Only admin can access this endpoint
    if (req.params.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const members = await User.find({ role: 'member' })
      .select('name email businessName contactPerson phone address logo')
      .lean();

    return res.status(200).json({ members });
  } catch (error) {
    console.error('Error fetching members:', error);
    
    // Log the error
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const adminId = currentUser.id;
      
      await Log.create({
        message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) failed to view all members - Error: ${error.message}`,
        type: 'error',
        user_id: adminId
      });
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get member details with commitments (admin only)
router.get('/member-details/:memberId/:userRole', isAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const adminId = currentUser.id;
    const { memberId } = req.params;

    // Only admin can access this endpoint
    if (req.params.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Get member details
    const member = await User.findById(memberId)
      .select('name email businessName contactPerson phone address logo')
      .lean();

    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: 'Member not found' 
      });
    }

    // Get member's commitments with deal details
    const commitments = await Commitment.find({ userId: memberId })
      .populate({
        path: 'dealId',
        select: 'name description discountPrice originalCost images'
      })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate total spent and total commitments
    const totalSpent = commitments.reduce((sum, commitment) => 
      sum + (commitment.totalPrice || 0), 0);
    
    // Log the action
    await Log.create({
      message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) viewed member details for ${member.name} (${member.email})`,
      type: 'info',
      user_id: adminId
    });

    return res.status(200).json({
      success: true,
      member,
      commitments,
      stats: {
        totalCommitments: commitments.length,
        totalSpent
      }
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    
    // Log the error
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const adminId = currentUser.id;
      
      await Log.create({
        message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) failed to view member details - Error: ${error.message}`,
        type: 'error',
        user_id: adminId
      });
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Get top 5 members based on commitment activity (admin only)
router.get('/top-members/:userRole', isAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const adminId = currentUser.id;

    // Only admin can access this endpoint
    if (req.params.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Aggregate to find members with the most commitments and highest spending
    const topMembersByCommitments = await Commitment.aggregate([
      { $group: {
          _id: '$userId',
          totalCommitments: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      { $sort: { totalCommitments: -1, totalSpent: -1 } },
      { $limit: 5 }
    ]);

    // Get the user details for these top members
    const memberIds = topMembersByCommitments.map(item => item._id);
    const topMembers = await User.find({ _id: { $in: memberIds } })
      .select('name email businessName contactPerson phone address logo')
      .lean();

    // Combine user details with their stats
    const result = topMembers.map(member => {
      const stats = topMembersByCommitments.find(item => 
        item._id.toString() === member._id.toString()
      );
      return {
        ...member,
        stats: {
          totalCommitments: stats.totalCommitments,
          totalSpent: stats.totalSpent
        }
      };
    });

    // Sort the final result by total commitments
    result.sort((a, b) => b.stats.totalCommitments - a.stats.totalCommitments);

    // Log the action
    await Log.create({
      message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) viewed top members - Found ${result.length} top members`,
      type: 'info',
      user_id: adminId
    });

    return res.status(200).json({ 
      success: true,
      topMembers: result 
    });
  } catch (error) {
    console.error('Error fetching top members:', error);
    
    // Log the error
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const adminId = currentUser.id;
      
      await Log.create({
        message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) failed to view top members - Error: ${error.message}`,
        type: 'error',
        user_id: adminId
      });
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

module.exports = router;
