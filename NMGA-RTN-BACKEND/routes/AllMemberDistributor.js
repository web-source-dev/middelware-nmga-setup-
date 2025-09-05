const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Deal = require('../models/Deals');
const Commitment = require('../models/Commitments');
const Log = require('../models/Logs');
const { isDistributorAdmin, getCurrentUserContext } = require('../middleware/auth');

// Get all members who have committed to a distributor's deals
router.get('/members', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;

        // Find all deals by this distributor
        const distributorDeals = await Deal.find({ distributor: distributorId });
        const dealIds = distributorDeals.map(deal => deal._id);

        // Find all commitments for these deals
        const commitments = await Commitment.find({
            dealId: { $in: dealIds }
        }).populate('userId');

        // Group commitments by user and calculate statistics
        const memberStats = {};
        commitments.forEach(commitment => {
            if (!memberStats[commitment.userId._id]) {
                memberStats[commitment.userId._id] = {
                    member: commitment.userId,
                    totalCommitments: 0,
                    totalSpent: 0,
                    quantity: 0,
                    lastCommitment: null
                };
            }
            memberStats[commitment.userId._id].totalCommitments++;
            memberStats[commitment.userId._id].totalSpent += commitment.totalPrice;
            
            // Calculate total quantity from all size commitments
            const totalQuantity = commitment.sizeCommitments.reduce((sum, sizeCommit) => sum + sizeCommit.quantity, 0);
            memberStats[commitment.userId._id].quantity += totalQuantity;
            
            // Track the most recent commitment
            if (!memberStats[commitment.userId._id].lastCommitment ||
                new Date(commitment.createdAt) > new Date(memberStats[commitment.userId._id].lastCommitment)) {
                memberStats[commitment.userId._id].lastCommitment = commitment.createdAt;
            }
        });

        const memberList = Object.values(memberStats);

        // Log the action with admin impersonation details if applicable
        if (isImpersonating) {
            await Log.create({
                message: `Admin ${originalUser.name} (${originalUser.email}) viewed members on behalf of distributor ${currentUser.name} (${currentUser.email}) - Found ${memberList.length} members`,
                type: 'info',
                user_id: distributorId
            });
        } else {
            await Log.create({
                message: `Distributor ${currentUser.name} (${currentUser.email}) viewed members - Found ${memberList.length} members`,
                type: 'info',
                user_id: distributorId
            });
        }

        res.json({
            success: true,
            data: memberList
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        
        // Log the error with admin impersonation details if applicable
        try {
            const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
            const distributorId = currentUser.id;
            
            if (isImpersonating) {
                await Log.create({
                    message: `Admin ${originalUser.name} (${originalUser.email}) failed to view members on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
                    type: 'error',
                    user_id: distributorId
                });
            } else {
                await Log.create({
                    message: `Distributor ${currentUser.name} (${currentUser.email}) failed to view members - Error: ${error.message}`,
                    type: 'error',
                    user_id: distributorId
                });
            }
        } catch (logError) {
            console.error('Error logging:', logError);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error fetching members',
            error: error.message
        });
    }
});

// Get detailed commitment history for a specific member
router.get('/member/:memberId', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;
        const { memberId } = req.params;

        // Find all deals by this distributor
        const distributorDeals = await Deal.find({ distributor: distributorId });
        const dealIds = distributorDeals.map(deal => deal._id);

        // Find all commitments for these deals by the specific member
        const memberCommitments = await Commitment.find({
            dealId: { $in: dealIds },
            userId: memberId
        }).populate('dealId');

        // Get member details
        const memberDetails = await User.findById(memberId);

        // Log the action with admin impersonation details if applicable
        if (isImpersonating) {
            await Log.create({
                message: `Admin ${originalUser.name} (${originalUser.email}) viewed member details for "${memberDetails?.name}" on behalf of distributor ${currentUser.name} (${currentUser.email})`,
                type: 'info',
                user_id: distributorId
            });
        } else {
            await Log.create({
                message: `Distributor ${currentUser.name} (${currentUser.email}) viewed member details for "${memberDetails?.name}"`,
                type: 'info',
                user_id: distributorId
            });
        }

        res.json({
            success: true,
            data: {
                member: memberDetails,
                commitments: memberCommitments
            }
        });
    } catch (error) {
        console.error('Error fetching member details:', error);
        
        // Log the error with admin impersonation details if applicable
        try {
            const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
            const distributorId = currentUser.id;
            
            if (isImpersonating) {
                await Log.create({
                    message: `Admin ${originalUser.name} (${originalUser.email}) failed to view member details on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
                    type: 'error',
                    user_id: distributorId
                });
            } else {
                await Log.create({
                    message: `Distributor ${currentUser.name} (${currentUser.email}) failed to view member details - Error: ${error.message}`,
                    type: 'error',
                    user_id: distributorId
                });
            }
        } catch (logError) {
            console.error('Error logging:', logError);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error fetching member details',
            error: error.message
        });
    }
});

// Get top members by commitment value
router.get('/top-members', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;
        const { limit = 10 } = req.query;

        // Find all deals by this distributor
        const distributorDeals = await Deal.find({ distributor: distributorId });
        const dealIds = distributorDeals.map(deal => deal._id);

        // Find all commitments for these deals
        const commitments = await Commitment.find({
            dealId: { $in: dealIds }
        }).populate('userId');

        // Group and calculate total spent by each member
        const memberStats = {};
        commitments.forEach(commitment => {
            if (!memberStats[commitment.userId._id]) {
                memberStats[commitment.userId._id] = {
                    member: commitment.userId,
                    totalCommitments: 0,
                    quantity: 0,
                    totalSpent: 0
                };
            }
            memberStats[commitment.userId._id].totalCommitments++;
            memberStats[commitment.userId._id].totalSpent += commitment.totalPrice;
            
            // Calculate total quantity from all size commitments
            const totalQuantity = commitment.sizeCommitments.reduce((sum, sizeCommit) => sum + sizeCommit.quantity, 0);
            memberStats[commitment.userId._id].quantity += totalQuantity;
        });

        // Convert to array and sort by total spent
        const sortedMembers = Object.values(memberStats)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, parseInt(limit));

        // Log the action with admin impersonation details if applicable
        if (isImpersonating) {
            await Log.create({
                message: `Admin ${originalUser.name} (${originalUser.email}) viewed top members on behalf of distributor ${currentUser.name} (${currentUser.email}) - Found ${sortedMembers.length} members`,
                type: 'info',
                user_id: distributorId
            });
        } else {
            await Log.create({
                message: `Distributor ${currentUser.name} (${currentUser.email}) viewed top members - Found ${sortedMembers.length} members`,
                type: 'info',
                user_id: distributorId
            });
        }

        res.json({
            success: true,
            data: sortedMembers
        });
    } catch (error) {
        console.error('Error fetching top members:', error);
        
        // Log the error with admin impersonation details if applicable
        try {
            const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
            const distributorId = currentUser.id;
            
            if (isImpersonating) {
                await Log.create({
                    message: `Admin ${originalUser.name} (${originalUser.email}) failed to view top members on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
                    type: 'error',
                    user_id: distributorId
                });
            } else {
                await Log.create({
                    message: `Distributor ${currentUser.name} (${currentUser.email}) failed to view top members - Error: ${error.message}`,
                    type: 'error',
                    user_id: distributorId
                });
            }
        } catch (logError) {
            console.error('Error logging:', logError);
        }
        
        res.status(500).json({
            success: false,
            message: 'Error fetching top members',
            error: error.message
        });
    }
});

module.exports = router;