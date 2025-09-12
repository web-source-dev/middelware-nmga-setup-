const Deal = require('../models/Deals');
const User = require('../models/User');
const Commitment = require('../models/Commitments');
const sendEmail = require('./email');
const { sendSMS } = require('./message');
const Log = require('../models/Logs');
const DistributorReminderTemplate = require('./EmailTemplates/DistributorReminderTemplate');
const DealMessages = require('./MessageTemplates/DealMessages');
const { isFeatureEnabled } = require('../config/features');
const { shouldSendPostingReminders, getNextMonthName } = require('./monthlySchedule');
const mongoose = require('mongoose');

/**
 * Check for monthly posting deadline reminders
 * Sends reminders 5, 3, and 1 days before the monthly posting deadline
 */
const checkPostingDeadlineReminders = async () => {
  try {
    // Check if distributor reminders feature is enabled
    if (!(await isFeatureEnabled('DISTRIBUTOR_REMINDERS'))) {
      console.log('📧 Distributor reminders feature is disabled');
      return;
    }

    // Verify database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Skipping distributor reminder check.');
      return;
    }

    // Check if we should send posting reminders based on monthly schedule
    const reminderInfo = shouldSendPostingReminders();
    if (!reminderInfo) {
      console.log('📅 No posting deadline reminders needed today');
      return;
    }

    const { nextMonth, daysUntilDeadline, reminderType } = reminderInfo;
    const deliveryMonth = getNextMonthName(nextMonth.month, nextMonth.year);
    
    console.log(`📅 Sending ${daysUntilDeadline}-day posting reminder for ${deliveryMonth.month} ${deliveryMonth.year}`);

    // Get all distributors
    const distributors = await User.find({
      role: 'distributor',
      isBlocked: false
    });

    if (distributors.length === 0) {
      console.log('No active distributors found');
      return;
    }

    // Send reminders to all distributors
    for (const distributor of distributors) {
      try {
        // Check if distributor has already been notified about this month's deadline
        const reminderKey = `${reminderType}_${nextMonth.month}_${nextMonth.year}`;
        
        // Check if this distributor has already been notified (multiple patterns for robustness)
        const existingReminder = await Log.findOne({
          $and: [
            { user_id: distributor._id },
            {
              $or: [
                { message: { $regex: new RegExp(`${daysUntilDeadline}-day posting reminder.*${distributor.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*${deliveryMonth.month} ${deliveryMonth.year}`) } },
                { message: { $regex: new RegExp(`${daysUntilDeadline}-day posting reminder.*${distributor.businessName?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*${deliveryMonth.month} ${deliveryMonth.year}`) } },
                { message: { $regex: new RegExp(`posting reminder.*${distributor.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*${deliveryMonth.month} ${deliveryMonth.year}`) } }
              ]
            }
          ]
        });

        if (existingReminder) {
          console.log(`⏭️ Skipping posting reminder for ${distributor.name} - already notified`);
          continue;
        }

        const distributorName = distributor.businessName || distributor.name;
        
        // Send email reminder
        await sendEmail(
          distributor.email,
          `Deal Posting Reminder - ${daysUntilDeadline} Days Remaining for ${deliveryMonth.month} ${deliveryMonth.year}`,
          DistributorReminderTemplate.postingDeadlineReminder(
            distributorName, 
            [], // No specific deals, this is a monthly reminder
            reminderType,
            deliveryMonth.month,
            deliveryMonth.year,
            nextMonth.deadline,
            nextMonth.commitmentStart,
            nextMonth.commitmentEnd
          )
        );

        // Send SMS if phone number exists
        if (distributor.phone) {
          const smsMessage = DealMessages.distributorPostingReminder(
            daysUntilDeadline, 
            [], // No specific deals
            deliveryMonth.month,
            deliveryMonth.year,
            nextMonth.deadline
          );
          
          await sendSMS(distributor.phone, smsMessage);
        }

        // Log the reminder
        await Log.create({
          message: `${daysUntilDeadline}-day posting reminder sent to ${distributorName} for ${deliveryMonth.month} ${deliveryMonth.year}`,
          type: 'info',
          user_id: distributor._id
        });

        console.log(`✅ Sent ${daysUntilDeadline}-day posting reminder to ${distributorName} for ${deliveryMonth.month} ${deliveryMonth.year}`);

      } catch (error) {
        console.error(`Failed to send ${daysUntilDeadline}-day reminder to ${distributor.name}:`, error);
        
        await Log.create({
          message: `Failed to send ${daysUntilDeadline}-day posting reminder to ${distributor.name}`,
          type: 'error',
          user_id: distributor._id
        });
      }
    }

  } catch (error) {
    console.error('Error in posting deadline reminder check:', error);
    
    if (mongoose.connection.readyState === 1) {
      try {
        await Log.create({
          message: `Error in posting deadline reminder check: ${error.message}`,
          type: 'error'
        });
      } catch (logError) {
        console.error('Failed to create error log:', logError);
      }
    }
  }
};

/**
 * Check for deals that need approval reminders
 * Sends reminders 5 days after commitment window closes
 */
const checkApprovalReminders = async () => {
  try {
    // Check if distributor reminders feature is enabled
    if (!(await isFeatureEnabled('DISTRIBUTOR_REMINDERS'))) {
      console.log('📧 Distributor reminders feature is disabled');
      return;
    }

    // Verify database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Database not connected. Skipping approval reminder check.');
      return;
    }

    const currentDate = new Date();
    
    // Calculate date 5 days after commitment window closed
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(currentDate.getDate() - 5);
    
    // Find deals where:
    // 1. Commitment window ended 5 days ago
    // 2. Deal has commitments
    // 3. Deal is still active (not yet approved/processed)
    // 4. Haven't sent approval reminder yet
    const dealsNeedingApproval = await Deal.find({
      commitmentEndsAt: {
        $gte: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate()),
        $lt: new Date(fiveDaysAgo.getFullYear(), fiveDaysAgo.getMonth(), fiveDaysAgo.getDate() + 1)
      },
      status: 'active', // Deal is active but needs approval
      commitments: { $exists: true, $not: { $size: 0 } }, // Has commitments
      $or: [
        { 'distributorReminders.approvalReminders': { $exists: false } },
        { 'distributorReminders.approvalReminders.5_days_after_commitment': { $exists: false } }
      ]
    })
    .populate('distributor', 'name email businessName phone')
    .populate('commitments');

    if (dealsNeedingApproval.length === 0) {
      console.log('No deals found needing approval reminders');
      return;
    }

    // Group deals by distributor
    const distributorDealsMap = new Map();
    
    for (const deal of dealsNeedingApproval) {
      const distributorId = deal.distributor._id.toString();
      
      if (!distributorDealsMap.has(distributorId)) {
        distributorDealsMap.set(distributorId, {
          distributor: deal.distributor,
          deals: []
        });
      }
      
      distributorDealsMap.get(distributorId).deals.push(deal);
    }

    // Send reminders to each distributor
    for (const [distributorId, { distributor, deals }] of distributorDealsMap.entries()) {
      try {
        const distributorName = distributor.businessName || distributor.name;
        
        // Send email reminder
        await sendEmail(
          distributor.email,
          'Deal Approval Reminder - Commitments Awaiting Review',
          DistributorReminderTemplate.dealApprovalReminder(distributorName, deals)
        );

        // Send SMS if phone number exists
        if (distributor.phone) {
          const totalCommitments = deals.reduce((sum, deal) => sum + (deal.commitments ? deal.commitments.length : 0), 0);
          const smsMessage = DealMessages.distributorApprovalReminder(deals.length, totalCommitments);
          
          await sendSMS(distributor.phone, smsMessage);
        }

        // Record reminder sent for each deal
        for (const deal of deals) {
          if (!deal.distributorReminders.approvalReminders.has('5_days_after_commitment')) {
            deal.distributorReminders.approvalReminders.set('5_days_after_commitment', []);
          }
          
          deal.distributorReminders.approvalReminders.get('5_days_after_commitment').push({
            reminderType: '5_days_after_commitment',
            sentAt: new Date()
          });
          
          await deal.save();
        }

        // Log the reminder
        await Log.create({
          message: `Approval reminder sent to ${distributorName} for ${deals.length} deal(s) with commitments`,
          type: 'info',
          user_id: distributor._id
        });

        console.log(`✅ Sent approval reminder to ${distributorName} for ${deals.length} deals`);

      } catch (error) {
        console.error(`Failed to send approval reminder to ${distributor.name}:`, error);
        
        await Log.create({
          message: `Failed to send approval reminder to ${distributor.name}`,
          type: 'error',
          user_id: distributor._id
        });
      }
    }

  } catch (error) {
    console.error('Error in approval reminder check:', error);
    
    if (mongoose.connection.readyState === 1) {
      try {
        await Log.create({
          message: `Error in approval reminder check: ${error.message}`,
          type: 'error'
        });
      } catch (logError) {
        console.error('Failed to create error log:', logError);
      }
    }
  }
};

/**
 * Main function to run all distributor reminder checks
 */
const runDistributorReminders = async () => {
  console.log('🔄 Running distributor reminder checks...');
  
  try {
    // Run posting deadline reminders
    await checkPostingDeadlineReminders();
    
    // Run approval reminders
    await checkApprovalReminders();
    
    console.log('✅ Distributor reminder checks completed');
  } catch (error) {
    console.error('Error running distributor reminders:', error);
  }
};

module.exports = {
  checkPostingDeadlineReminders,
  checkApprovalReminders,
  runDistributorReminders
};
