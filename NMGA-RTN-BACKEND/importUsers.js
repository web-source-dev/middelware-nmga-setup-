const fs = require('fs');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const { generateUniqueLoginKey } = require('./utils/loginKeyGenerator');
require('dotenv').config();

// Counter for statistics
const stats = {
  total: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  errors: 0,
  bySheet: {},
  skipReasons: {
    noCoOp: 0,
    noEmail: 0,
    bothMissing: 0,
    alreadyExists: 0,
    other: 0
  }
};

// Function to normalize field names to handle case insensitivity and alternate spellings
function getFieldValue(record, fieldName) {
  // Create variations of field names to check
  const fieldVariations = [
    fieldName,
    fieldName.toUpperCase(),
    fieldName.toLowerCase(),
    fieldName.replace('-', ' '),
    fieldName.replace(' ', '-'),
    fieldName.replace(' ', ''),
    fieldName.replace('-', '')
  ];
  
  // Check all variations
  for (const variant of fieldVariations) {
    if (record[variant] !== undefined) {
      return record[variant];
    }
  }
  
  return undefined;
}

// Check if a value is not empty (handles various empty values)
function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

// Function to process the Excel file
async function importUsers() {
  // Reset stats
  Object.keys(stats).forEach(key => {
    if (typeof stats[key] === 'number') {
      stats[key] = 0;
    } else if (key === 'bySheet') {
      stats.bySheet = {};
    } else if (typeof stats[key] === 'object') {
      Object.keys(stats[key]).forEach(subKey => {
        stats[key][subKey] = 0;
      });
    }
  });

  try {
    console.log('Starting user import process');
    
    // Path to Excel file
    const EXCEL_FILE_PATH = './users.xlsx'; // Fixed path to the xlsx file
    
    // Read the Excel file
    const workbook = xlsx.readFile(EXCEL_FILE_PATH);
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets in Excel file`);
    
    // Process each sheet
    for (const sheetName of sheetNames) {
      console.log(`\nProcessing sheet: ${sheetName}`);
      
      // Initialize stats for this sheet
      stats.bySheet[sheetName] = {
        total: 0,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        skipReasons: {
          noCoOp: 0,
          noEmail: 0,
          bothMissing: 0,
          alreadyExists: 0,
          other: 0
        }
      };
      
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON
      const results = xlsx.utils.sheet_to_json(worksheet);
      
      console.log(`Parsed ${results.length} records from sheet ${sheetName}`);
      stats.total += results.length;
      stats.bySheet[sheetName].total = results.length;
      
      // Process each record
      for (const record of results) {
        try {
          // Get field values using our helper function
          const coopField = getFieldValue(record, 'CO-OP');
          const emailField = getFieldValue(record, 'EMAIL');
          const companyName = getFieldValue(record, 'COMPANY NAME');
          const storeName = getFieldValue(record, 'STORE NAME');
          
          // Skip if missing either CO-OP or EMAIL
          const hasCoOp = hasValue(coopField);
          const hasEmail = hasValue(emailField);
          
          if (!hasCoOp && !hasEmail) {
            stats.skipped++;
            stats.skipReasons.bothMissing++;
            stats.bySheet[sheetName].skipped++;
            stats.bySheet[sheetName].skipReasons.bothMissing++;
            continue;
          } else if (!hasCoOp) {
            stats.skipped++;
            stats.skipReasons.noCoOp++;
            stats.bySheet[sheetName].skipped++;
            stats.bySheet[sheetName].skipReasons.noCoOp++;
            continue;
          } else if (!hasEmail) {
            stats.skipped++;
            stats.skipReasons.noEmail++;
            stats.bySheet[sheetName].skipped++;
            stats.bySheet[sheetName].skipReasons.noEmail++;
            continue;
          }
          
          // Normalize the email to avoid duplicate checks failing due to case differences
          const normalizedEmail = String(emailField).toLowerCase().trim();
          
          // Combine address fields
          const address = [
            getFieldValue(record, 'ADDRESS') || '',
            getFieldValue(record, 'CITY') || '',
            getFieldValue(record, 'ST') || '',
            getFieldValue(record, 'ZIP') || ''
          ].filter(Boolean).join(', ');
          
          // Hash the default password using bcrypt (same as registration process)
          const defaultPassword = 'changeme123';
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);
          
          // Generate unique login key
          const loginKey = await generateUniqueLoginKey(User);
          
          // Create user object
          const userData = {
            email: normalizedEmail,
            name: (storeName || companyName || 'Member').trim(),
            businessName: companyName || 'Business Name Not Provided',
            contactPerson: getFieldValue(record, 'CONTACT') || 'Contact Not Provided',
            address: address || 'Address Not Provided',
            fax: getFieldValue(record, 'FAX') || '',
            phone: getFieldValue(record, 'PHONE') || '',
            role: 'member', // Set role to "member" if CO-OP field has value
            password: hashedPassword, // Use bcrypt hashed password (same as registration)
            login_key: loginKey, // Add unique login key
            isVerified: true // Set users as verified
          };
          
          // Check if user already exists
          const existingUser = await User.findOne({ email: userData.email });
          if (existingUser) {
            // Update existing user with new bcrypt password and other fields
            existingUser.password = hashedPassword;
            existingUser.name = userData.name;
            existingUser.businessName = userData.businessName;
            existingUser.contactPerson = userData.contactPerson;
            existingUser.address = userData.address;
            existingUser.fax = userData.fax;
            existingUser.phone = userData.phone;
            existingUser.role = userData.role;
            existingUser.login_key = userData.login_key;
            existingUser.isVerified = userData.isVerified;
            
            await existingUser.save();
            console.log(`Updated existing user: ${userData.email} with new bcrypt password`);
            stats.updated++;
            stats.bySheet[sheetName].updated++;
          } else {
            // Create new user
            const user = new User(userData);
            await user.save();
            console.log(`Created new user: ${userData.email}`);
            stats.created++;
            stats.bySheet[sheetName].created++;
          }
        } catch (error) {
          console.error(`Error processing record:`, error);
          stats.errors++;
          stats.skipReasons.other++;
          stats.bySheet[sheetName].errors++;
          stats.bySheet[sheetName].skipReasons.other++;
        }
      }
    }
    
    // Print summary
    console.log('\n======= IMPORT COMPLETED =======');
    console.log(`Total records across all sheets: ${stats.total}`);
    console.log(`Users created: ${stats.created}`);
    console.log(`Users updated: ${stats.updated}`);
    console.log(`Records skipped: ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    
    return {
      success: true,
      stats: {
        total: stats.total,
        created: stats.created,
        updated: stats.updated,
        skipped: stats.skipped,
        errors: stats.errors,
        skipReasons: stats.skipReasons
      }
    };
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return { success: false, error: error.message };
  }
}

// Export the function for use in routes
module.exports = { importUsers };

// If script is run directly, execute the import
if (require.main === module) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(async () => {
    console.log('MongoDB connected successfully'); 
    
    const result = await importUsers();
    
    if (result.success) {
      console.log('\n✅ Import completed successfully!');
      
      // Ask if user wants to send credentials
      console.log('\n📧 Would you like to send login credentials to members?');
      console.log('Choose an option:');
      console.log('1. Send to ALL members in database');
      console.log('2. Send only to members who exist in BOTH CSV and database');
      console.log('3. Skip sending credentials');
      console.log('Press Ctrl+C to skip or wait 5 seconds to continue with option 2...');
      
      try {
        // Wait 5 seconds for user to cancel
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('\nSending credentials to members who exist in both CSV and database...');
        const { sendMemberCredentials } = require('./sendMemberCredentials');
        const credentialsResult = await sendMemberCredentials();
        
        if (credentialsResult.success) {
          console.log('✅ Credentials sent successfully!');
          console.log(`📊 Summary: ${credentialsResult.stats.matchedEmails} members matched, ${credentialsResult.stats.sent} emails sent`);
        } else {
          console.log('❌ Failed to send credentials:', credentialsResult.error);
        }
      } catch (error) {
        console.log('Skipped sending credentials (user cancelled or error occurred)');
      }
    } else {
      console.log('\n❌ Import failed:', result.error);
    }
    
    mongoose.connection.close();
    console.log('Database connection closed');
  }).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
} 