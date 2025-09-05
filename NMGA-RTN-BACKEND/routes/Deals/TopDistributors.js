const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Commitment = require('../../models/Commitments');
const Deal = require('../../models/Deals');
const { isAdmin, getCurrentUserContext } = require('../../middleware/auth');
const Log = require('../../models/Logs');

// Get all distributors with their performance metrics (admin only)
router.get('/all-distributors/:userRole', isAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const adminId = currentUser.id;

    // Only admin can access this endpoint
    if (req.params.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const distributors = await User.find({ role: 'distributor' })
      .select('name email businessName contactPerson phone address logo')
      .lean();

    // Log the action
    await Log.create({
      message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) viewed all distributors - Found ${distributors.length} distributors`,
      type: 'info',
      user_id: adminId
    });

    return res.status(200).json({ 
      success: true,
      distributors 
    });
  } catch (error) {
    console.error('Error fetching distributors:', error);
    
    // Log the error
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const adminId = currentUser.id;
      
      await Log.create({
        message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) failed to view all distributors - Error: ${error.message}`,
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

// Get top 5 distributors based on deals and commitments (admin only)
router.get('/top-distributors/:userRole', isAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const adminId = currentUser.id;

    // Only admin can access this endpoint
    if (req.params.userRole !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Get all distributors
    const distributors = await User.find({ role: 'distributor' })
      .select('name email businessName contactPerson phone address logo')
      .lean();

    // Get deals for each distributor
    const distributorStats = await Promise.all(
      distributors.map(async (distributor) => {
        // Get all deals by this distributor
        const deals = await Deal.find({ distributor: distributor._id }).lean();
        
        // Get all commitments for these deals
        const dealIds = deals.map(deal => deal._id);
        const commitments = await Commitment.find({
          dealId: { $in: dealIds }
        }).lean();

        // Calculate statistics
        const totalDeals = deals.length;
        const activeDeals = deals.filter(deal => deal.status === 'active').length;
        const totalCommitments = commitments.length;
        const totalSpent = commitments.reduce((sum, commitment) => sum + (commitment.totalPrice || 0), 0);

        return {
          ...distributor,
          stats: {
            totalDeals,
            activeDeals,
            totalCommitments,
            totalSpent
          }
        };
      })
    );

    // Sort by total deals and commitments
    distributorStats.sort((a, b) => {
      if (b.stats.totalDeals !== a.stats.totalDeals) {
        return b.stats.totalDeals - a.stats.totalDeals;
      }
      return b.stats.totalCommitments - a.stats.totalCommitments;
    });

    // Get top 5
    const topDistributors = distributorStats.slice(0, 5);

    // Log the action
    await Log.create({
      message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) viewed top distributors - Found ${topDistributors.length} top distributors`,
      type: 'info',
      user_id: adminId
    });

    return res.status(200).json({ 
      success: true,
      topDistributors 
    });
  } catch (error) {
    console.error('Error fetching top distributors:', error);
    
    // Log the error
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const adminId = currentUser.id;
      
      await Log.create({
        message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) failed to view top distributors - Error: ${error.message}`,
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