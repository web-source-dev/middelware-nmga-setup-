const express = require('express');
const router = express.Router();
const Deal = require('../../models/Deals');
const Commitment = require('../../models/Commitments');
const User = require('../../models/User');
const Log = require('../../models/Logs');
// Send email notifications to all users
const sendEmail = require('../../utils/email');
const CommitmentNotificationTemplate = require('../../utils/EmailTemplates/CommitmentNotificationTemplate');
const { broadcastDealUpdate, broadcastSingleDealUpdate } = require('../../utils/dealUpdates');
const { isDistributorAdmin,isAdmin, getCurrentUserContext } = require('../../middleware/auth');
const { format } = require('date-fns');
const { logCollaboratorAction } = require('../../utils/collaboratorLogger');

// Get all deals with commitments for a distributor
router.get('/distributor-deals', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;
        
        const {
            page = 1,
            limit = 10,
            search = '',
            month,
            status,
            startDate,
            endDate,
            commitmentStatus
        } = req.query;

        // Base query
        let query = { distributor: distributorId };

        // Add condition to only get deals with commitments
        query = {
            ...query,
            commitments: { $exists: true, $ne: [] }
        };

        // Search filter
        if (search) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Date filters
        let dateQuery = {};

        if (month && month !== '') {
            // If month is specified, filter by that month
            const currentYear = new Date().getFullYear();
            const monthIndex = parseInt(month) - 1; // Convert to 0-based index
            const startOfMonth = new Date(currentYear, monthIndex, 1);
            const endOfMonth = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);
            dateQuery = { 
                $or: [
                    // Deal created in this month
                    { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
                    // Deal ends in this month
                    { dealEndsAt: { $gte: startOfMonth, $lte: endOfMonth } }
                ]
            };
        } else if (startDate && endDate) {
            // If date range is specified
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999); // Set to end of day
            
            dateQuery = {
                $or: [
                    // Deal created in date range
                    { createdAt: { $gte: startDateObj, $lte: endDateObj } },
                    // Deal ends in date range
                    { dealEndsAt: { $gte: startDateObj, $lte: endDateObj } },
                    // Deal spans the date range (starts before, ends after)
                    {
                        createdAt: { $lte: startDateObj },
                        dealEndsAt: { $gte: endDateObj }
                    }
                ]
            };
        }
        
        // Only apply date query if there are date filters
        if (Object.keys(dateQuery).length > 0) {
            query = { ...query, ...dateQuery };
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count for pagination (this will now only count deals with commitments)
        const totalDeals = await Deal.countDocuments(query);

        // Fetch deals with pagination
        const deals = await Deal.find(query)
            .populate({
                path: 'commitments',
                populate: {
                    path: 'userId',
                    select: 'name email businessName'
                }
            })
            .sort({ totalCommitments: -1, totalQuantity: -1, createdAt: -1 }) // Sort by commitment count, then quantity, then date
            .skip(skip)
            .limit(parseInt(limit));

        // Transform the data (no need to filter null values anymore)
        const dealsWithStats = deals.map(deal => {
            const commitments = deal.commitments || [];
            let filteredCommitments = commitments;

            // Filter commitments by status if specified
            if (commitmentStatus) {
                filteredCommitments = commitments.filter(c => c.status === commitmentStatus);
            }

            const approvedCommitments = commitments.filter(c => c.status === 'approved');
            const pendingCommitments = commitments.filter(c => c.status === 'pending');

            // Calculate total quantity for each status
            const calcTotalQuantity = (commitArray) => {
                return commitArray.reduce((sum, c) => {
                    // If sizeCommitments exists, sum all sizes
                    if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                        return sum + c.sizeCommitments.reduce((sizeSum, sizeItem) => 
                            sizeSum + sizeItem.quantity, 0);
                    }
                    // Fall back to regular quantity
                    return sum + (c.quantity || 0);
                }, 0);
            };

            const pendingTotalQuantity = calcTotalQuantity(pendingCommitments);
            const approvedTotalQuantity = calcTotalQuantity(approvedCommitments);
            const totalCommitmentCount = commitments.length;

            return {
                _id: deal._id,
                name: deal.name,
                description: deal.description,
                size: deal.size,
                sizes: deal.sizes || [],
                originalCost: deal.originalCost,
                discountPrice: deal.discountPrice,
                minimumQuantity: deal.minQtyForDiscount,
                discountTiers: deal.discountTiers || [],
                category: deal.category,
                status: deal.status,
                dealEndsAt: deal.dealEndsAt,
                bulkAction: deal.bulkAction,
                bulkStatus: deal.bulkStatus,
                createdAt: deal.createdAt,
                totalCommitments: totalCommitmentCount,
                pendingCommitments: commitments.filter(c => c.status === 'pending').length,
                approvedCommitments: commitments.filter(c => c.status === 'approved').length,
                declinedCommitments: commitments.filter(c => c.status === 'declined').length,

                totalPQuantity: pendingTotalQuantity,
                totalPAmount: pendingCommitments.reduce((sum, c) => sum + c.totalPrice, 0),
                totalQuantity: approvedTotalQuantity,
                totalAmount: approvedCommitments.reduce((sum, c) => sum + c.totalPrice, 0)
            };
        }).filter(deal => deal !== null); // Remove null values
        
        // Sort by total commitments and quantity
        dealsWithStats.sort((a, b) => {
            // First sort by total commitments (descending)
            if (b.totalCommitments !== a.totalCommitments) {
                return b.totalCommitments - a.totalCommitments;
            }
            // Then by total quantity (descending)
            return (b.totalQuantity + b.totalPQuantity) - (a.totalQuantity + a.totalPQuantity);
        });

        console.log("dealsWithStats" , dealsWithStats)
        
        // Log the action
        await logCollaboratorAction(req, 'view_distributor_deals', 'deals list', {
            additionalInfo: `Found ${dealsWithStats.length} deals with commitments`,
            search: search || '',
            month: month || '',
            status: status || '',
            commitmentStatus: commitmentStatus || ''
        });
        
        res.json({
            success: true,
            deals: dealsWithStats,
            pagination: {
                total: totalDeals,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalDeals / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching distributor deals:', error);
        res.status(500).json({ success: false, message: 'Error fetching deals' });
    }
});

// Get all deals with commitments for admin
router.get('/admin-all-deals', isAdmin, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            month,
            status,
            startDate,
            endDate,
            commitmentStatus,
            distributorId
        } = req.query;

        // Base query
        let query = {};
        query = {
            ...query,
            commitments: { $exists: true, $ne: [] }
        };
        // If distributorId is provided, filter by that distributor
        if (distributorId) {
            query.distributor = distributorId;
        }

        // Search filter
        if (search) {
            query = {
                ...query,
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Date filters
        let dateQuery = {};

        if (month && month !== '') {
            // If month is specified, filter by that month
            const currentYear = new Date().getFullYear();
            const monthIndex = parseInt(month) - 1; // Convert to 0-based index
            const startOfMonth = new Date(currentYear, monthIndex, 1);
            const endOfMonth = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59);
            dateQuery = { 
                $or: [
                    // Deal created in this month
                    { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
                    // Deal ends in this month
                    { dealEndsAt: { $gte: startOfMonth, $lte: endOfMonth } }
                ]
            };
        } else if (startDate && endDate) {
            // If date range is specified
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            endDateObj.setHours(23, 59, 59, 999); // Set to end of day
            
            dateQuery = {
                $or: [
                    // Deal created in date range
                    { createdAt: { $gte: startDateObj, $lte: endDateObj } },
                    // Deal ends in date range
                    { dealEndsAt: { $gte: startDateObj, $lte: endDateObj } },
                    // Deal spans the date range (starts before, ends after)
                    {
                        createdAt: { $lte: startDateObj },
                        dealEndsAt: { $gte: endDateObj }
                    }
                ]
            };
        }
        
        // Only apply date query if there are date filters
        if (Object.keys(dateQuery).length > 0) {
            query = { ...query, ...dateQuery };
        }

        // Status filter
        if (status) {
            query.status = status;
        }

        // Calculate skip value for pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count for pagination
        const totalDeals = await Deal.countDocuments(query);

        // Fetch deals with pagination and populate distributor information
        const deals = await Deal.find(query)
            .populate({
                path: 'commitments',
                populate: {
                    path: 'userId',
                    select: 'name email businessName'
                }
            })
            .populate({
                path: 'distributor',
                select: 'name email businessName'
            })
            .sort({ totalCommitments: -1, totalQuantity: -1, createdAt: -1 }) // Sort by commitment count, then quantity, then date
            .skip(skip)
            .limit(parseInt(limit));

        // Transform the data to include commitment counts
        const dealsWithStats = deals.map(deal => {
            const commitments = deal.commitments || [];
            let filteredCommitments = commitments;

            // Filter commitments by status if specified
            if (commitmentStatus) {
                filteredCommitments = commitments.filter(c => c.status === commitmentStatus);
            }

            const approvedCommitments = commitments.filter(c => c.status === 'approved');
            const pendingCommitments = commitments.filter(c => c.status === 'pending');

            // Calculate total quantity for each status
            const calcTotalQuantity = (commitArray) => {
                return commitArray.reduce((sum, c) => {
                    // If sizeCommitments exists, sum all sizes
                    if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                        return sum + c.sizeCommitments.reduce((sizeSum, sizeItem) => 
                            sizeSum + sizeItem.quantity, 0);
                    }
                    // Fall back to regular quantity
                    return sum + (c.quantity || 0);
                }, 0);
            };

            const pendingTotalQuantity = calcTotalQuantity(pendingCommitments);
            const approvedTotalQuantity = calcTotalQuantity(approvedCommitments);
            const totalCommitmentCount = commitments.length;

            return {
                _id: deal._id,
                name: deal.name,
                description: deal.description,
                size: deal.size,
                sizes: deal.sizes || [],
                originalCost: deal.originalCost,
                discountPrice: deal.discountPrice,
                minimumQuantity: deal.minQtyForDiscount,
                discountTiers: deal.discountTiers || [],
                category: deal.category,
                status: deal.status,
                distributor: deal.distributor,
                dealEndsAt: deal.dealEndsAt,
                bulkAction: deal.bulkAction,
                bulkStatus: deal.bulkStatus,
                createdAt: deal.createdAt,
                totalCommitments: totalCommitmentCount,
                pendingCommitments: commitments.filter(c => c.status === 'pending').length,
                approvedCommitments: commitments.filter(c => c.status === 'approved').length,
                declinedCommitments: commitments.filter(c => c.status === 'declined').length,
                
                totalPQuantity: pendingTotalQuantity,
                totalPAmount: pendingCommitments.reduce((sum, c) => sum + c.totalPrice, 0),
                totalQuantity: approvedTotalQuantity,
                totalAmount: approvedCommitments.reduce((sum, c) => sum + c.totalPrice, 0)
            };
        }).filter(deal => deal !== null); // Remove null values
        
        // Sort by total commitments and quantity
        dealsWithStats.sort((a, b) => {
            // First sort by total commitments (descending)
            if (b.totalCommitments !== a.totalCommitments) {
                return b.totalCommitments - a.totalCommitments;
            }
            // Then by total quantity (descending)
            return (b.totalQuantity + b.totalPQuantity) - (a.totalQuantity + a.totalPQuantity);
        });
        
        console.log("dealsWithStats" , dealsWithStats)

        // Log the action
        await logCollaboratorAction(req, 'view_admin_all_deals', 'deals list', {
            additionalInfo: `Found ${dealsWithStats.length} deals with commitments`,
            search: search || '',
            month: month || '',
            status: status || '',
            commitmentStatus: commitmentStatus || '',
            distributorId: distributorId || 'all'
        });

        res.json({
            success: true,
            deals: dealsWithStats,
            pagination: {
                total: totalDeals,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalDeals / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching deals for admin:', error);
        res.status(500).json({ success: false, message: 'Error fetching deals' });
    }
});

// Bulk approve commitments for a deal
router.post('/bulk-approve-commitments', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;
        const { dealId } = req.body;

        // Verify the deal belongs to the distributor
        const deal = await Deal.findOne({ _id: dealId, distributor: distributorId });
        if (!deal) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Find all pending commitments for this deal
        const pendingCommitments = await Commitment.find({
            dealId: dealId,
            status: 'pending'
        }).populate('userId', 'name email businessName');

        // Update all pending commitments to approved
        const result = await Commitment.updateMany(
            {
                dealId: dealId,
                status: 'pending'
            },
            {
                $set: {
                    status: 'approved',
                    distributorResponse: 'Approved by distributor'
                }
            }
        );


        for (const commitment of pendingCommitments) {
            const userName = commitment.userId.businessName || commitment.userId.name;
            const userEmail = commitment.userId.email;

            const emailHtml = CommitmentNotificationTemplate.statusUpdate(
                userName,
                deal.name,
                'approved',
                commitment.quantity || 0,
                commitment.totalPrice,
                commitment.sizeCommitments
            );

            try {
                await sendEmail(userEmail, `Your Commitment for ${deal.name} has been Approved`, emailHtml);
            } catch (emailError) {
                console.error(`Failed to send email to ${userEmail}:`, emailError);
                // Continue with other emails even if one fails
            }
        }

        // Update the deal's total sold and revenue
        const commitments = await Commitment.find({ dealId: dealId, status: 'approved' });
        
        // Calculate totalSold properly accounting for sizeCommitments
        const totalSold = commitments.reduce((sum, c) => {
            // If sizeCommitments exists and has items, sum all sizes
            if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                return sum + c.sizeCommitments.reduce((sizeSum, sizeItem) => 
                    sizeSum + sizeItem.quantity, 0);
            }
            // Otherwise, use the regular quantity field (or 0 if it doesn't exist)
            return sum + (c.quantity || 0);
        }, 0);
        
        const totalRevenue = commitments.reduce((sum, c) => sum + c.totalPrice, 0);

        const updatedDeal = await Deal.findByIdAndUpdate(dealId, {
            totalSold,
            totalRevenue,
            status: 'inactive',
            bulkAction: true,
            bulkStatus: 'approved'
        }, { new: true });

        // Log the action
        await logCollaboratorAction(req, 'bulk_approve_commitments', 'commitments', {
            dealTitle: deal.name,
            dealId: dealId,
            additionalInfo: `Approved ${result.modifiedCount} commitments`
        });

        // Broadcast real-time updates for the deal update
        if (updatedDeal) {
            broadcastDealUpdate(updatedDeal, 'updated');
            broadcastSingleDealUpdate(dealId, updatedDeal);
        }

        res.json({
            success: true,
            message: 'All pending commitments have been approved',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error bulk approving commitments:', error);
        
        // Log the error
        await logCollaboratorAction(req, 'bulk_approve_commitments_failed', 'commitments', {
            additionalInfo: `Error: ${error.message}`
        });
        
        res.status(500).json({ success: false, message: 'Error processing bulk approval' });
    }
});

// Bulk decline commitments for a deal
router.post('/bulk-decline-commitments', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;
        const { dealId } = req.body;

        // Verify the deal belongs to the distributor
        const deal = await Deal.findOne({ _id: dealId, distributor: distributorId });
        if (!deal) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Find all pending commitments for this deal
        const pendingCommitments = await Commitment.find({
            dealId: dealId,
            status: 'pending'
        }).populate('userId', 'name email businessName');

        // Update all pending commitments to declined
        const result = await Commitment.updateMany(
            {
                dealId: dealId,
                status: 'pending'
            },
            {
                $set: {
                    status: 'declined',
                    distributorResponse: 'Declined by distributor'
                }
            }
        );


        for (const commitment of pendingCommitments) {
            const userName = commitment.userId.businessName || commitment.userId.name;
            const userEmail = commitment.userId.email;

            const emailHtml = CommitmentNotificationTemplate.statusUpdate(
                userName,
                deal.name,
                'declined',
                commitment.quantity || 0,
                commitment.totalPrice,
                commitment.sizeCommitments
            );

            try {
                await sendEmail(userEmail, `Your Commitment for ${deal.name} has been Declined`, emailHtml);
            } catch (emailError) {
                console.error(`Failed to send email to ${userEmail}:`, emailError);
                // Continue with other emails even if one fails
            }
        }

        const updatedDeal = await Deal.findByIdAndUpdate(dealId, {
            status: 'inactive',
            bulkAction: true,
            bulkStatus: 'rejected'
        }, { new: true });

        // Log the action
        await logCollaboratorAction(req, 'bulk_decline_commitments', 'commitments', {
            dealTitle: deal.name,
            dealId: dealId,
            additionalInfo: `Declined ${result.modifiedCount} commitments`
        });

        // Broadcast real-time updates for the deal update
        if (updatedDeal) {
            broadcastDealUpdate(updatedDeal, 'updated');
            broadcastSingleDealUpdate(dealId, updatedDeal);
        }

        res.json({
            success: true,
            message: 'All pending commitments have been declined',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error bulk declining commitments:', error);
        
        // Log the error
        await logCollaboratorAction(req, 'bulk_decline_commitments_failed', 'commitments', {
            additionalInfo: `Error: ${error.message}`
        });
        
        res.status(500).json({ success: false, message: 'Error processing bulk decline' });
    }
});

// Get detailed commitments for a specific deal
router.get('/deal-commitments/:dealId', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;
        const { dealId } = req.params;

        // Base query for commitments
        const query = { dealId };

        // Check if request is from a distributor (if distributorId is provided)
        if (distributorId) {
            // Verify the deal belongs to the distributor
            const deal = await Deal.findOne({ _id: dealId, distributor: distributorId });
            if (!deal) {
                return res.status(403).json({ success: false, message: 'Unauthorized access' });
            }
        }

        const commitments = await Commitment.find(query)
            .populate('userId', 'name email businessName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            commitments
        });
    } catch (error) {
        console.error('Error fetching deal commitments:', error);
        res.status(500).json({ success: false, message: 'Error fetching commitments' });
    }
});

// Update single commitment status
router.post('/update-commitment-status', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;
        const { commitmentId, status, distributorResponse, adminAction } = req.body;

        // Fetch the commitment
        const commitment = await Commitment.findById(commitmentId)
            .populate('dealId')
            .populate('userId', 'name email businessName');

        if (!commitment) {
            return res.status(404).json({ success: false, message: 'Commitment not found' });
        }

        // Verify the deal belongs to the distributor
        const deal = await Deal.findOne({
            _id: commitment.dealId._id,
            distributor: distributorId
        });

        if (!deal) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Update the commitment status
        commitment.status = status;
        commitment.distributorResponse = distributorResponse;
        await commitment.save();

        // Send email notification to the user
        const userName = commitment.userId.businessName || commitment.userId.name;
        const userEmail = commitment.userId.email;
        const dealName = commitment.dealId.name;

        const emailHtml = CommitmentNotificationTemplate.statusUpdate(
            userName,
            dealName,
            status,
            commitment.quantity || 0,
            commitment.totalPrice,
            commitment.sizeCommitments
        );

        try {
            await sendEmail(userEmail, `Your Commitment for ${dealName} has been ${status.charAt(0).toUpperCase() + status.slice(1)}`, emailHtml);
        } catch (emailError) {
            console.error(`Failed to send email to ${userEmail}:`, emailError);
            // Continue even if email fails
        }

        // If status is approved, update deal totals
        if (status === 'approved') {
            const approvedCommitments = await Commitment.find({
                dealId: commitment.dealId._id,
                status: 'approved'
            });

            // Calculate totalSold properly accounting for sizeCommitments
            const totalSold = approvedCommitments.reduce((sum, c) => {
                // If sizeCommitments exists and has items, sum all sizes
                if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                    return sum + c.sizeCommitments.reduce((sizeSum, sizeItem) => 
                        sizeSum + sizeItem.quantity, 0);
                }
                // Otherwise, use the regular quantity field (or 0 if it doesn't exist)
                return sum + (c.quantity || 0);
            }, 0);
            
            const totalRevenue = approvedCommitments.reduce((sum, c) => sum + c.totalPrice, 0);

            await Deal.findByIdAndUpdate(commitment.dealId._id, {
                totalSold,
                totalRevenue
            });
        }

        // Log the action
        await logCollaboratorAction(req, 'update_commitment_status', 'commitment', {
            dealTitle: commitment.dealId.name,
            dealId: commitment.dealId._id,
            commitmentId: commitmentId,
            status: status,
            additionalInfo: `Updated commitment status to ${status}`
        });

        res.json({
            success: true,
            message: `Commitment status updated to ${status}`,
            commitment
        });
    } catch (error) {
        console.error('Error updating commitment status:', error);
        
        // Log the error
        await logCollaboratorAction(req, 'update_commitment_status_failed', 'commitment', {
            additionalInfo: `Error: ${error.message}`
        });
        
        res.status(500).json({ success: false, message: 'Error updating commitment status' });
    }
});

// Get deal analytics
router.get('/deal-analytics/:dealId', isDistributorAdmin, async (req, res) => {
    try {
        const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
        const distributorId = currentUser.id;
        const { dealId } = req.params;

        // Verify the deal belongs to the distributor
        const deal = await Deal.findOne({ _id: dealId, distributor: distributorId })
            .populate('distributor', 'name email businessName');

        if (!deal) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Get all commitments for this deal
        const commitments = await Commitment.find({ dealId })
            .populate('userId', 'name email businessName')
            .sort({ createdAt: -1 });

        // Calculate analytics data
        const totalRevenue = commitments.reduce((sum, c) => sum + c.totalPrice, 0);
        const totalQuantity = commitments.reduce((sum, c) => {
            if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                return sum + c.sizeCommitments.reduce((sizeSum, sizeItem) => 
                    sizeSum + sizeItem.quantity, 0);
            }
            return sum + (c.quantity || 0);
        }, 0);

        const uniqueMembers = new Set(commitments.map(c => c.userId._id.toString()));
        const totalUniqueMembers = uniqueMembers.size;

        // Calculate average order value
        const averageOrderValue = commitments.length > 0 ? totalRevenue / commitments.length : 0;

        // Calculate order completion rate (assuming all commitments are completed)
        const orderCompletionRate = 100; // Since we're only looking at existing commitments

        // Calculate repeat order rate
        const memberOrderCounts = {};
        commitments.forEach(c => {
            const memberId = c.userId._id.toString();
            memberOrderCounts[memberId] = (memberOrderCounts[memberId] || 0) + 1;
        });
        const repeatOrders = Object.values(memberOrderCounts).filter(count => count > 1).length;
        const repeatOrderRate = totalUniqueMembers > 0 ? (repeatOrders / totalUniqueMembers) * 100 : 0;

        // Calculate daily performance
        const dailyData = {};
        commitments.forEach(c => {
            const date = format(new Date(c.createdAt), 'yyyy-MM-dd');
            if (!dailyData[date]) {
                dailyData[date] = { orders: 0, revenue: 0, quantity: 0 };
            }
            dailyData[date].orders += 1;
            dailyData[date].revenue += c.totalPrice;
            dailyData[date].quantity += c.sizeCommitments ? 
                c.sizeCommitments.reduce((sum, sizeItem) => sum + sizeItem.quantity, 0) : 
                (c.quantity || 0);
        });

        const dailyPerformance = Object.entries(dailyData).map(([date, data]) => ({
            date,
            orders: data.orders,
            revenue: data.revenue,
            quantity: data.quantity
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate peak day orders
        const peakDayOrders = Math.max(...dailyPerformance.map(d => d.orders), 0);
        const averageDailyOrders = dailyPerformance.length > 0 ? 
            dailyPerformance.reduce((sum, d) => sum + d.orders, 0) / dailyPerformance.length : 0;

        // Calculate hourly activity (simplified - using creation time)
        const hourlyData = {};
        commitments.forEach(c => {
            const hour = new Date(c.createdAt).getHours();
            hourlyData[hour] = (hourlyData[hour] || 0) + 1;
        });

        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
            hour: `${hour}:00`,
            orders: hourlyData[hour] || 0
        }));

        // Get top members
        const memberStats = {};
        commitments.forEach(c => {
            const memberId = c.userId._id.toString();
            if (!memberStats[memberId]) {
                memberStats[memberId] = {
                    name: c.userId.businessName || c.userId.name,
                    totalQuantity: 0,
                    totalValue: 0,
                    lastOrderDate: c.createdAt,
                    sizeBreakdown: {}
                };
            }
            
            if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                c.sizeCommitments.forEach(sizeItem => {
                    memberStats[memberId].totalQuantity += sizeItem.quantity;
                    memberStats[memberId].sizeBreakdown[sizeItem.size] = 
                        (memberStats[memberId].sizeBreakdown[sizeItem.size] || 0) + sizeItem.quantity;
                });
            } else {
                memberStats[memberId].totalQuantity += c.quantity || 0;
            }
            
            memberStats[memberId].totalValue += c.totalPrice;
            if (c.createdAt > memberStats[memberId].lastOrderDate) {
                memberStats[memberId].lastOrderDate = c.createdAt;
            }
        });

        const topMembers = Object.values(memberStats)
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 10);

        // Prepare overview data
        const overview = {
            totalRevenue,
            totalQuantity,
            totalUniqueMembers,
            averageOrderValue,
            orderCompletionRate,
            repeatOrderRate,
            peakDayOrders,
            averageDailyOrders
        };

        // Log the action
        await logCollaboratorAction(req, 'view_deal_analytics', 'deal analytics', {
            dealTitle: deal.name,
            dealId: dealId,
            additionalInfo: `Analytics for deal with ${totalUniqueMembers} unique members`
        });

        res.json({
            success: true,
            dealInfo: {
                name: deal.name,
                category: deal.category,
                distributor: deal.distributor.name || deal.distributor.email,
                originalCost: deal.originalCost,
                discountPrice: deal.discountPrice,
                sizes: deal.sizes || [],
                discountTiers: deal.discountTiers || [],
                minQtyForDiscount: deal.minQtyForDiscount
            },
            overview,
            dailyPerformance,
            hourlyActivity,
            memberInsights: {
                topMembers,
                quantitySegments: []
            }
        });

    } catch (error) {
        console.error('Error fetching deal analytics:', error);
        
        // Log the error
        await logCollaboratorAction(req, 'view_deal_analytics_failed', 'deal analytics', {
            additionalInfo: `Error: ${error.message}`
        });
        
        res.status(500).json({ success: false, message: 'Error fetching analytics data' });
    }
});


// Get detailed commitments for a specific deal
router.get('/deal-commitments-admin/:dealId', isAdmin, async (req, res) => {
    try {
        const { dealId } = req.params;

        // Base query for commitments
        const query = { dealId };

        // Check if request is from a distributor (if distributorId is provided)
        if (dealId) {
            // Verify the deal belongs to the distributor
            const deal = await Deal.findOne({ _id: dealId });
            if (!deal) {
                return res.status(403).json({ success: false, message: 'Unauthorized access' });
            }
        }

        const commitments = await Commitment.find(query)
            .populate('userId', 'name email businessName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            commitments
        });
    } catch (error) {
        console.error('Error fetching deal commitments:', error);
        res.status(500).json({ success: false, message: 'Error fetching commitments' });
    }
});

// Bulk approve commitments for a deal
router.post('/bulk-approve-commitments-admin', isAdmin, async (req, res) => {
    try {
        const { dealId, distributorId } = req.body;

        // Verify the deal belongs to the distributor
        const deal = await Deal.findOne({ _id: dealId, distributor: distributorId });
        if (!deal) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Find all pending commitments for this deal
        const pendingCommitments = await Commitment.find({
            dealId: dealId,
            status: 'pending'
        }).populate('userId', 'name email businessName');

        // Update all pending commitments to approved
        const result = await Commitment.updateMany(
            {
                dealId: dealId,
                status: 'pending'
            },
            {
                $set: {
                    status: 'approved',
                    distributorResponse: 'Approved by distributor'
                }
            }
        );


        for (const commitment of pendingCommitments) {
            const userName = commitment.userId.businessName || commitment.userId.name;
            const userEmail = commitment.userId.email;

            const emailHtml = CommitmentNotificationTemplate.statusUpdate(
                userName,
                deal.name,
                'approved',
                commitment.quantity || 0,
                commitment.totalPrice,
                commitment.sizeCommitments
            );

            try {
                await sendEmail(userEmail, `Your Commitment for ${deal.name} has been Approved`, emailHtml);
            } catch (emailError) {
                console.error(`Failed to send email to ${userEmail}:`, emailError);
                // Continue with other emails even if one fails
            }
        }

        // Update the deal's total sold and revenue
        const commitments = await Commitment.find({ dealId: dealId, status: 'approved' });
        
        // Calculate totalSold properly accounting for sizeCommitments
        const totalSold = commitments.reduce((sum, c) => {
            // If sizeCommitments exists and has items, sum all sizes
            if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                return sum + c.sizeCommitments.reduce((sizeSum, sizeItem) => 
                    sizeSum + sizeItem.quantity, 0);
            }
            // Otherwise, use the regular quantity field (or 0 if it doesn't exist)
            return sum + (c.quantity || 0);
        }, 0);
        
        const totalRevenue = commitments.reduce((sum, c) => sum + c.totalPrice, 0);

        const updatedDeal = await Deal.findByIdAndUpdate(dealId, {
            totalSold,
            totalRevenue,
            status: 'inactive',
            bulkAction: true,
            bulkStatus: 'approved'
        }, { new: true });
        
        // Log the action
        await logCollaboratorAction(req, 'bulk_approve_commitments_admin', 'commitments', {
            dealTitle: deal.name,
            dealId: dealId,
            additionalInfo: `Admin approved ${result.modifiedCount} commitments`
        });

        // Broadcast real-time updates for the deal update
        if (updatedDeal) {
            broadcastDealUpdate(updatedDeal, 'updated');
            broadcastSingleDealUpdate(dealId, updatedDeal);
        }

        res.json({
            success: true,
            message: 'All pending commitments have been approved',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error bulk approving commitments:', error);        
        res.status(500).json({ success: false, message: 'Error processing bulk approval' });
    }
});

// Bulk decline commitments for a deal
router.post('/bulk-decline-commitments-admin', isAdmin, async (req, res) => {
    try {
        const { dealId, distributorId } = req.body;

        // Verify the deal belongs to the distributor
        const deal = await Deal.findOne({ _id: dealId, distributor: distributorId });
        if (!deal) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Find all pending commitments for this deal
        const pendingCommitments = await Commitment.find({
            dealId: dealId,
            status: 'pending'
        }).populate('userId', 'name email businessName');

        // Update all pending commitments to declined
        const result = await Commitment.updateMany(
            {
                dealId: dealId,
                status: 'pending'
            },
            {
                $set: {
                    status: 'declined',
                    distributorResponse: 'Declined by distributor'
                }
            }
        );


        for (const commitment of pendingCommitments) {
            const userName = commitment.userId.businessName || commitment.userId.name;
            const userEmail = commitment.userId.email;

            const emailHtml = CommitmentNotificationTemplate.statusUpdate(
                userName,
                deal.name,
                'declined',
                commitment.quantity || 0,
                commitment.totalPrice,
                commitment.sizeCommitments
            );

            try {
                await sendEmail(userEmail, `Your Commitment for ${deal.name} has been Declined`, emailHtml);
            } catch (emailError) {
                console.error(`Failed to send email to ${userEmail}:`, emailError);
                // Continue with other emails even if one fails
            }
        }

        const updatedDeal = await Deal.findByIdAndUpdate(dealId, {
            status: 'inactive',
            bulkAction: true,
            bulkStatus: 'rejected'
        }, { new: true });

        // Log the action
        await logCollaboratorAction(req, 'bulk_decline_commitments_admin', 'commitments', {
            dealTitle: deal.name,
            dealId: dealId,
            additionalInfo: `Admin declined ${result.modifiedCount} commitments`
        });

        // Broadcast real-time updates for the deal update
        if (updatedDeal) {
            broadcastDealUpdate(updatedDeal, 'updated');
            broadcastSingleDealUpdate(dealId, updatedDeal);
        }

        res.json({
            success: true,
            message: 'All pending commitments have been declined',
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error bulk declining commitments:', error);
        
        res.status(500).json({ success: false, message: 'Error processing bulk decline' });
    }
});

// Get deal analytics
router.get('/deal-analytics-admin/:dealId', isAdmin, async (req, res) => {
    try {
        const { dealId } = req.params;

        // Verify the deal belongs to the distributor
        const deal = await Deal.findOne({ _id: dealId })
            .populate('distributor', 'name email businessName');

        if (!deal) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Get all commitments for this deal
        const commitments = await Commitment.find({ dealId })
            .populate('userId', 'name email businessName')
            .sort({ createdAt: -1 });

        // Calculate analytics data
        const totalRevenue = commitments.reduce((sum, c) => sum + c.totalPrice, 0);
        const totalQuantity = commitments.reduce((sum, c) => {
            if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                return sum + c.sizeCommitments.reduce((sizeSum, sizeItem) => 
                    sizeSum + sizeItem.quantity, 0);
            }
            return sum + (c.quantity || 0);
        }, 0);

        const uniqueMembers = new Set(commitments.map(c => c.userId._id.toString()));
        const totalUniqueMembers = uniqueMembers.size;

        // Calculate average order value
        const averageOrderValue = commitments.length > 0 ? totalRevenue / commitments.length : 0;

        // Calculate order completion rate (assuming all commitments are completed)
        const orderCompletionRate = 100; // Since we're only looking at existing commitments

        // Calculate repeat order rate
        const memberOrderCounts = {};
        commitments.forEach(c => {
            const memberId = c.userId._id.toString();
            memberOrderCounts[memberId] = (memberOrderCounts[memberId] || 0) + 1;
        });
        const repeatOrders = Object.values(memberOrderCounts).filter(count => count > 1).length;
        const repeatOrderRate = totalUniqueMembers > 0 ? (repeatOrders / totalUniqueMembers) * 100 : 0;

        // Calculate daily performance
        const dailyData = {};
        commitments.forEach(c => {
            const date = format(new Date(c.createdAt), 'yyyy-MM-dd');
            if (!dailyData[date]) {
                dailyData[date] = { orders: 0, revenue: 0, quantity: 0 };
            }
            dailyData[date].orders += 1;
            dailyData[date].revenue += c.totalPrice;
            dailyData[date].quantity += c.sizeCommitments ? 
                c.sizeCommitments.reduce((sum, sizeItem) => sum + sizeItem.quantity, 0) : 
                (c.quantity || 0);
        });

        const dailyPerformance = Object.entries(dailyData).map(([date, data]) => ({
            date,
            orders: data.orders,
            revenue: data.revenue,
            quantity: data.quantity
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate peak day orders
        const peakDayOrders = Math.max(...dailyPerformance.map(d => d.orders), 0);
        const averageDailyOrders = dailyPerformance.length > 0 ? 
            dailyPerformance.reduce((sum, d) => sum + d.orders, 0) / dailyPerformance.length : 0;

        // Calculate hourly activity (simplified - using creation time)
        const hourlyData = {};
        commitments.forEach(c => {
            const hour = new Date(c.createdAt).getHours();
            hourlyData[hour] = (hourlyData[hour] || 0) + 1;
        });

        const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
            hour: `${hour}:00`,
            orders: hourlyData[hour] || 0
        }));

        // Get top members
        const memberStats = {};
        commitments.forEach(c => {
            const memberId = c.userId._id.toString();
            if (!memberStats[memberId]) {
                memberStats[memberId] = {
                    name: c.userId.businessName || c.userId.name,
                    totalQuantity: 0,
                    totalValue: 0,
                    lastOrderDate: c.createdAt,
                    sizeBreakdown: {}
                };
            }
            
            if (c.sizeCommitments && c.sizeCommitments.length > 0) {
                c.sizeCommitments.forEach(sizeItem => {
                    memberStats[memberId].totalQuantity += sizeItem.quantity;
                    memberStats[memberId].sizeBreakdown[sizeItem.size] = 
                        (memberStats[memberId].sizeBreakdown[sizeItem.size] || 0) + sizeItem.quantity;
                });
            } else {
                memberStats[memberId].totalQuantity += c.quantity || 0;
            }
            
            memberStats[memberId].totalValue += c.totalPrice;
            if (c.createdAt > memberStats[memberId].lastOrderDate) {
                memberStats[memberId].lastOrderDate = c.createdAt;
            }
        });

        const topMembers = Object.values(memberStats)
            .sort((a, b) => b.totalValue - a.totalValue)
            .slice(0, 10);

        // Prepare overview data
        const overview = {
            totalRevenue,
            totalQuantity,
            totalUniqueMembers,
            averageOrderValue,
            orderCompletionRate,
            repeatOrderRate,
            peakDayOrders,
            averageDailyOrders
        };

        res.json({
            success: true,
            dealInfo: {
                name: deal.name,
                category: deal.category,
                distributor: deal.distributor.name || deal.distributor.email,
                originalCost: deal.originalCost,
                discountPrice: deal.discountPrice,
                sizes: deal.sizes || [],
                discountTiers: deal.discountTiers || [],
                minQtyForDiscount: deal.minQtyForDiscount
            },
            overview,
            dailyPerformance,
            hourlyActivity,
            memberInsights: {
                topMembers,
                quantitySegments: []
            }
        });

    } catch (error) {
        console.error('Error fetching deal analytics:', error);
        
        res.status(500).json({ success: false, message: 'Error fetching analytics data' });
    }
});


module.exports = router;
