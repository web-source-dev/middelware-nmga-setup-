const express = require('express');
const router = express.Router();
const Deal = require('../../models/Deals');
const Commitment = require('../../models/Commitments');
const { isAdmin, getCurrentUserContext } = require('../../middleware/auth');
const Log = require('../../models/Logs');

// Get recent deals and commitments (admin only)
router.get('/recent', isAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const adminId = currentUser.id;

        // Get 5 most recent deals
        const recentDeals = await Deal.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('distributor', 'name businessName');

        // Get 5 most recent commitments
        const recentCommitments = await Commitment.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name businessName')
            .populate('dealId', 'name description');

        // Log the action
        await Log.create({
            message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) viewed recent activity - Deals: ${recentDeals.length}, Commitments: ${recentCommitments.length}`,
            type: 'info',
            user_id: adminId
        });

        res.json({
            success: true,
            recentDeals,
            recentCommitments
        });
    } catch (error) {
        console.error('Error fetching recent data:', error);
        
        // Log the error
        try {
            const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
            const adminId = currentUser.id;
            
            await Log.create({
                message: `Admin ${isImpersonating ? originalUser.name : currentUser.name} (${isImpersonating ? originalUser.email : currentUser.email}) failed to view recent activity - Error: ${error.message}`,
                type: 'error',
                user_id: adminId
            });
        } catch (logError) {
            console.error('Error logging:', logError);
        }
        
        res.status(500).json({
            success: false,
            message: "Error fetching recent data",
            error: error.message
        });
    }
});

module.exports = router;
