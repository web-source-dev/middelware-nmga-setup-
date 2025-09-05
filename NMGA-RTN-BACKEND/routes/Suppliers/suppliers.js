const express = require("express");
const router = express.Router();
const Supplier = require("../../models/Suppliers");
const User = require("../../models/User");
const Commitment = require("../../models/Commitments");
const Deal = require("../../models/Deals");
const Log = require("../../models/Logs");
const { isDistributorAdmin, getCurrentUserContext } = require("../../middleware/auth");

// Get all suppliers
router.get("/", async (req, res) => {
  try {
    const suppliers = await Supplier.find()
      .populate("assignedTo", "name businessName email")
      .populate("assignedBy", "name businessName email");
    res.status(200).json({ success: true, suppliers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers",
      error: error.message,
    });
  }
});

// Get all suppliers assigned by a specific distributor
router.get("/by-distributor", isDistributorAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const distributorId = currentUser.id;
    
    const suppliers = await Supplier.find({ assignedBy: distributorId })
      .populate("assignedTo", "name businessName email")
      .populate("assignedBy", "name businessName email");
    
    // Log the action with admin impersonation details if applicable
    if (isImpersonating) {
      await Log.create({
        message: `Admin ${originalUser.name} (${originalUser.email}) viewed suppliers on behalf of distributor ${currentUser.name} (${currentUser.email})`,
        type: 'info',
        user_id: distributorId
      });
    } else {
      await Log.create({
        message: `Distributor ${currentUser.name} (${currentUser.email}) viewed suppliers`,
        type: 'info',
        user_id: distributorId
      });
    }
    
    res.status(200).json({ success: true, suppliers });
  } catch (error) {
    console.error('Error fetching suppliers by distributor:', error);
    
    // Log the error with admin impersonation details if applicable
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const distributorId = currentUser.id;
      
      if (isImpersonating) {
        await Log.create({
          message: `Admin ${originalUser.name} (${originalUser.email}) failed to view suppliers on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      } else {
        await Log.create({
          message: `Distributor ${currentUser.name} (${currentUser.email}) failed to view suppliers - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      }
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers by distributor",
      error: error.message,
    });
  }
});

// Create a new supplier
router.post("/", isDistributorAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const distributorId = currentUser.id;
    const { name, email } = req.body;
    
    // Check if supplier with this email already exists for this distributor
    const existingSupplier = await Supplier.findOne({ 
      email,
      assignedBy: distributorId 
    });
    
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "A supplier with this email already exists for your account",
      });
    }
    
    const newSupplier = new Supplier({ 
      name, 
      email,
      assignedBy: distributorId 
    });
    
    await newSupplier.save();
    
    // Log the action with admin impersonation details if applicable
    if (isImpersonating) {
      await Log.create({
        message: `Admin ${originalUser.name} (${originalUser.email}) created supplier "${name}" (${email}) on behalf of distributor ${currentUser.name} (${currentUser.email})`,
        type: 'success',
        user_id: distributorId
      });
    } else {
      await Log.create({
        message: `Distributor ${currentUser.name} (${currentUser.email}) created supplier "${name}" (${email})`,
        type: 'success',
        user_id: distributorId
      });
    }
    
    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      supplier: newSupplier,
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    
    // Log the error with admin impersonation details if applicable
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const distributorId = currentUser.id;
      
      if (isImpersonating) {
        await Log.create({
          message: `Admin ${originalUser.name} (${originalUser.email}) failed to create supplier on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      } else {
        await Log.create({
          message: `Distributor ${currentUser.name} (${currentUser.email}) failed to create supplier - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      }
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating supplier",
      error: error.message,
    });
  }
});

// Assign supplier to a member
router.put("/assign/:supplierId", isDistributorAdmin, async (req, res) => {
  try {
    console.log('Assign supplier request:', req.params, req.body);
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const distributorId = currentUser.id;
    const { supplierId } = req.params;
    const { memberId, multiMemberAssignment } = req.body;
    
    console.log('Current user:', currentUser);
    console.log('Distributor ID:', distributorId);
    console.log('Supplier ID:', supplierId);
    console.log('Member ID:', memberId);
    
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }
    
    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }
    
    // Verify the supplier belongs to this distributor
    console.log('Supplier assignedBy:', supplier.assignedBy);
    console.log('Distributor ID:', distributorId);
    console.log('Supplier assignedBy toString:', supplier.assignedBy.toString());
    console.log('Distributor ID toString:', distributorId.toString());
    console.log('Are they equal?', supplier.assignedBy.toString() === distributorId.toString());
    
    if (supplier.assignedBy.toString() !== distributorId.toString()) {
      console.log('Permission denied - supplier does not belong to this distributor');
      return res.status(403).json({
        success: false,
        message: "You don't have permission to assign this supplier",
      });
    }
    
    // Allow assigning a member to multiple suppliers
    // Check if this member is already assigned to this specific supplier to avoid duplicates
    if (supplier.assignedTo && supplier.assignedTo.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: "This member is already assigned to this supplier",
      });
    }
    
    // Initialize assignedTo as an array if it doesn't exist
    if (!supplier.assignedTo) {
      supplier.assignedTo = [];
    }
    
    // Add the member to the assignedTo array
    supplier.assignedTo.push(memberId);
    
    // Set the distributor if not already set
    if (!supplier.assignedBy) {
      supplier.assignedBy = distributorId;
    }
    
    supplier.assignedAt = Date.now();
    
    await supplier.save();
    
    // Get all suppliers assigned to this member for the response
    const assignedSuppliers = await Supplier.find({
      assignedTo: { $in: [memberId] },
      assignedBy: distributorId
    });
    
    // Log the action with admin impersonation details if applicable
    if (isImpersonating) {
      await Log.create({
        message: `Admin ${originalUser.name} (${originalUser.email}) assigned supplier "${supplier.name}" to member "${member.name}" on behalf of distributor ${currentUser.name} (${currentUser.email})`,
        type: 'success',
        user_id: distributorId
      });
    } else {
      await Log.create({
        message: `Distributor ${currentUser.name} (${currentUser.email}) assigned supplier "${supplier.name}" to member "${member.name}"`,
        type: 'success',
        user_id: distributorId
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Supplier assigned successfully",
      supplier,
      assignedSuppliers
    });
  } catch (error) {
    console.error('Error assigning supplier:', error);
    
    // Log the error with admin impersonation details if applicable
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const distributorId = currentUser.id;
      
      if (isImpersonating) {
        await Log.create({
          message: `Admin ${originalUser.name} (${originalUser.email}) failed to assign supplier on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      } else {
        await Log.create({
          message: `Distributor ${currentUser.name} (${currentUser.email}) failed to assign supplier - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      }
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: "Error assigning supplier",
      error: error.message,
    });
  }
});

// Remove supplier assignment for a specific member
router.put("/unassign/:supplierId", isDistributorAdmin, async (req, res) => {
  try {
    console.log('Unassign supplier request:', req.params, req.body);
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const distributorId = currentUser.id;
    const { supplierId } = req.params;
    const { memberId } = req.body;
    
    console.log('Current user:', currentUser);
    console.log('Distributor ID:', distributorId);
    console.log('Supplier ID:', supplierId);
    console.log('Member ID:', memberId);
    
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }
    
    // Check if supplier is assigned to this distributor
    console.log('Unassign - Supplier assignedBy:', supplier.assignedBy);
    console.log('Unassign - Distributor ID:', distributorId);
    console.log('Unassign - Are they equal?', supplier.assignedBy.toString() === distributorId.toString());
    
    if (supplier.assignedBy.toString() !== distributorId.toString()) {
      console.log('Unassign - Permission denied - supplier does not belong to this distributor');
      return res.status(403).json({
        success: false,
        message: "You don't have permission to unassign this supplier",
      });
    }
    
    // Get member info for logging
    const member = await User.findById(memberId);
    const memberName = member ? member.name : 'Unknown Member';
    
    // Remove specific member from assignedTo array
    if (supplier.assignedTo && supplier.assignedTo.length > 0) {
      supplier.assignedTo = supplier.assignedTo.filter(
        id => id.toString() !== memberId
      );
    }
    
    await supplier.save();
    
    // Log the action with admin impersonation details if applicable
    if (isImpersonating) {
      await Log.create({
        message: `Admin ${originalUser.name} (${originalUser.email}) unassigned supplier "${supplier.name}" from member "${memberName}" on behalf of distributor ${currentUser.name} (${currentUser.email})`,
        type: 'success',
        user_id: distributorId
      });
    } else {
      await Log.create({
        message: `Distributor ${currentUser.name} (${currentUser.email}) unassigned supplier "${supplier.name}" from member "${memberName}"`,
        type: 'success',
        user_id: distributorId
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Supplier unassigned successfully from member",
      supplier,
    });
  } catch (error) {
    console.error('Error unassigning supplier:', error);
    
    // Log the error with admin impersonation details if applicable
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const distributorId = currentUser.id;
      
      if (isImpersonating) {
        await Log.create({
          message: `Admin ${originalUser.name} (${originalUser.email}) failed to unassign supplier on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      } else {
        await Log.create({
          message: `Distributor ${currentUser.name} (${currentUser.email}) failed to unassign supplier - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      }
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: "Error unassigning supplier",
      error: error.message,
    });
  }
});

// Get members who have committed to a distributor's deals
router.get("/committed-members", isDistributorAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const distributorId = currentUser.id;
    const { month, year } = req.query; // Add month and year query parameters
    
    // Find all deals by this distributor
    const deals = await Deal.find({ distributor: distributorId });
    const dealIds = deals.map(deal => deal._id);
    
    // Base query for commitments
    let commitmentsQuery = {
      dealId: { $in: dealIds }
    };
    
    // Add date filtering if month and year are provided
    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of the month
      
      commitmentsQuery.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    // Find all commitments for these deals with optional date filtering
    const commitments = await Commitment.find(commitmentsQuery)
    .populate("userId", "name email businessName phone address")
    .populate({
      path: "dealId",
      select: "name description category images",
      populate: {
        path: "distributor",
        select: "name businessName"
      }
    });
    
    // Group commitments by user
    const userCommitments = {};
    commitments.forEach(commitment => {
      const userId = commitment.userId._id.toString();
      if (!userCommitments[userId]) {
        userCommitments[userId] = {
          user: commitment.userId,
          commitments: [],
          totalSpent: 0,
          dealCount: 0
        };
      }
      
      userCommitments[userId].commitments.push(commitment);
      userCommitments[userId].totalSpent += commitment.totalPrice;
      userCommitments[userId].dealCount += 1;
    });
    
    // Convert to array and get assigned suppliers
    const members = await Promise.all(
      Object.values(userCommitments).map(async (item) => {
        // Find ALL suppliers where this member is in the assignedTo array
        const assignedSuppliers = await Supplier.find({ 
          assignedTo: { $in: [item.user._id] },
          assignedBy: distributorId
        });
        
        return {
          ...item,
          suppliers: assignedSuppliers || [],
          supplier: assignedSuppliers.length > 0 ? assignedSuppliers[0] : null // Keep for backward compatibility
        };
      })
    );
    
    // Log the action with admin impersonation details if applicable
    if (isImpersonating) {
      await Log.create({
        message: `Admin ${originalUser.name} (${originalUser.email}) viewed committed members on behalf of distributor ${currentUser.name} (${currentUser.email}) - Found ${members.length} members`,
        type: 'info',
        user_id: distributorId
      });
    } else {
      await Log.create({
        message: `Distributor ${currentUser.name} (${currentUser.email}) viewed committed members - Found ${members.length} members`,
        type: 'info',
        user_id: distributorId
      });
    }
    
    res.status(200).json({
      success: true,
      members
    });
  } catch (error) {
    console.error('Error fetching committed members:', error);
    
    // Log the error with admin impersonation details if applicable
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const distributorId = currentUser.id;
      
      if (isImpersonating) {
        await Log.create({
          message: `Admin ${originalUser.name} (${originalUser.email}) failed to view committed members on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      } else {
        await Log.create({
          message: `Distributor ${currentUser.name} (${currentUser.email}) failed to view committed members - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      }
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: "Error fetching committed members",
      error: error.message,
    });
  }
});

// Get member commitment data for export
router.get("/export-member-data/:memberId", isDistributorAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const distributorId = currentUser.id;
    const { memberId } = req.params;
    
    // Find all deals by this distributor
    const deals = await Deal.find({ distributor: distributorId });
    const dealIds = deals.map(deal => deal._id);
    
    // Find all commitments by this member for these deals
    const commitments = await Commitment.find({
      userId: memberId,
      dealId: { $in: dealIds }
    })
    .populate("userId", "name email businessName phone address")
    .populate({
      path: "dealId",
      select: "name description category images sizes",
      populate: {
        path: "distributor",
        select: "name businessName contactPerson phone email"
      }
    });
    
    const user = await User.findById(memberId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }
    
    // Find all suppliers where this member is in the assignedTo array
    const suppliers = await Supplier.find({
      assignedTo: { $in: [memberId] },
      assignedBy: distributorId
    });
    
    // Keep the first supplier as 'supplier' for backward compatibility
    const primarySupplier = suppliers.length > 0 ? suppliers[0] : null;
    
    const exportData = {
      member: {
        id: user._id,
        name: user.name,
        businessName: user.businessName,
        email: user.email,
        phone: user.phone,
        address: user.address
      },
      supplier: primarySupplier ? {
        id: primarySupplier._id,
        name: primarySupplier.name,
        email: primarySupplier.email
      } : null,
      suppliers: suppliers.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email
      })),
      commitments: commitments.map(c => ({
        id: c._id,
        dealName: c.dealId.name,
        dealDescription: c.dealId.description,
        category: c.dealId.category,
        sizeCommitments: c.sizeCommitments,
        totalPrice: c.totalPrice,
        status: c.status,
        createdAt: c.createdAt
      })),
      summary: {
        totalDeals: commitments.length,
        totalSpent: commitments.reduce((sum, c) => sum + c.totalPrice, 0)
      }
    };
    
    // Log the action with admin impersonation details if applicable
    if (isImpersonating) {
      await Log.create({
        message: `Admin ${originalUser.name} (${originalUser.email}) exported member data for "${user.name}" on behalf of distributor ${currentUser.name} (${currentUser.email})`,
        type: 'info',
        user_id: distributorId
      });
    } else {
      await Log.create({
        message: `Distributor ${currentUser.name} (${currentUser.email}) exported member data for "${user.name}"`,
        type: 'info',
        user_id: distributorId
      });
    }
    
    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting member data:', error);
    
    // Log the error with admin impersonation details if applicable
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const distributorId = currentUser.id;
      
      if (isImpersonating) {
        await Log.create({
          message: `Admin ${originalUser.name} (${originalUser.email}) failed to export member data on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      } else {
        await Log.create({
          message: `Distributor ${currentUser.name} (${currentUser.email}) failed to export member data - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      }
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: "Error exporting member data",
      error: error.message,
    });
  }
});

// Get all members assigned to a supplier for export
router.get("/export-supplier-data/:supplierId", isDistributorAdmin, async (req, res) => {
  try {
    const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
    const distributorId = currentUser.id;
    const { supplierId } = req.params;
    
    const supplier = await Supplier.findById(supplierId)
      .populate("assignedTo", "name email businessName phone address");
      
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }
    
    // Check if supplier is assigned to this distributor
    if (supplier.assignedBy.toString() !== distributorId) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this supplier's data",
      });
    }
    
    const memberIds = supplier.assignedTo.map(member => member._id);
    
    // Find all deals by this distributor
    const deals = await Deal.find({ distributor: distributorId });
    const dealIds = deals.map(deal => deal._id);
    
    // Find all commitments by these members for these deals
    const commitments = await Commitment.find({
      userId: { $in: memberIds },
      dealId: { $in: dealIds }
    })
    .populate("userId", "name email businessName phone address")
    .populate({
      path: "dealId",
      select: "name description category images sizes",
      populate: {
        path: "distributor",
        select: "name businessName contactPerson phone email"
      }
    });
    
    // Group commitments by member
    const memberData = {};
    commitments.forEach(commitment => {
      const userId = commitment.userId._id.toString();
      if (!memberData[userId]) {
        memberData[userId] = {
          member: {
            id: commitment.userId._id,
            name: commitment.userId.name,
            businessName: commitment.userId.businessName,
            email: commitment.userId.email,
            phone: commitment.userId.phone,
            address: commitment.userId.address
          },
          commitments: [],
          summary: {
            totalDeals: 0,
            totalSpent: 0
          }
        };
      }
      
      memberData[userId].commitments.push({
        id: commitment._id,
        dealName: commitment.dealId.name,
        dealDescription: commitment.dealId.description,
        category: commitment.dealId.category,
        sizeCommitments: commitment.sizeCommitments,
        totalPrice: commitment.totalPrice,
        status: commitment.status,
        createdAt: commitment.createdAt
      });
      
      memberData[userId].summary.totalDeals += 1;
      memberData[userId].summary.totalSpent += commitment.totalPrice;
    });
    
    // Add members who have no commitments yet
    supplier.assignedTo.forEach(member => {
      const userId = member._id.toString();
      if (!memberData[userId]) {
        memberData[userId] = {
          member: {
            id: member._id,
            name: member.name,
            businessName: member.businessName,
            email: member.email,
            phone: member.phone,
            address: member.address
          },
          commitments: [],
          summary: {
            totalDeals: 0,
            totalSpent: 0
          }
        };
      }
    });
    
    const exportData = {
      supplier: {
        id: supplier._id,
        name: supplier.name,
        email: supplier.email
      },
      members: Object.values(memberData),
      summary: {
        totalMembers: Object.keys(memberData).length,
        totalCommitments: commitments.length,
        totalValue: commitments.reduce((sum, c) => sum + c.totalPrice, 0)
      }
    };
    
    // Log the action with admin impersonation details if applicable
    if (isImpersonating) {
      await Log.create({
        message: `Admin ${originalUser.name} (${originalUser.email}) exported supplier data for "${supplier.name}" on behalf of distributor ${currentUser.name} (${currentUser.email})`,
        type: 'info',
        user_id: distributorId
      });
    } else {
      await Log.create({
        message: `Distributor ${currentUser.name} (${currentUser.email}) exported supplier data for "${supplier.name}"`,
        type: 'info',
        user_id: distributorId
      });
    }
    
    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting supplier data:', error);
    
    // Log the error with admin impersonation details if applicable
    try {
      const { currentUser, originalUser, isImpersonating } = getCurrentUserContext(req);
      const distributorId = currentUser.id;
      
      if (isImpersonating) {
        await Log.create({
          message: `Admin ${originalUser.name} (${originalUser.email}) failed to export supplier data on behalf of distributor ${currentUser.name} (${currentUser.email}) - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      } else {
        await Log.create({
          message: `Distributor ${currentUser.name} (${currentUser.email}) failed to export supplier data - Error: ${error.message}`,
          type: 'error',
          user_id: distributorId
        });
      }
    } catch (logError) {
      console.error('Error logging:', logError);
    }
    
    res.status(500).json({
      success: false,
      message: "Error exporting supplier data",
      error: error.message,
    });
  }
});

module.exports = router;
