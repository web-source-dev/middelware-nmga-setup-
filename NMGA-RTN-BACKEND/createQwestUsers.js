const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const fs = require('fs');
const User = require('./models/User');
const sendEmail = require('./utils/email');
const baseTemplate = require('./utils/EmailTemplates/baseTemplate');
const path = require('path');
const { generateUniqueLoginKey } = require('./utils/loginKeyGenerator');
require('dotenv').config();

// XLSX file path - update this to your XLSX file name
const XLSX_FILE_PATH = path.join(__dirname, 'users1.xlsx');

// Statistics tracking
const stats = {
  total: 0,
  created: 0,
  skipped: 0,
  errors: 0,
  emailsSent: 0,
  emailsFailed: 0,
  errorDetails: []
};

const sentEmails = [
  "rbrown@golatitudes.com",
  "breckstewart@qwestoffice.net",
  "jmomchin@golatitudes.com",
  "receiving@golatitudes.com",
  "sean.collins.1991@gmail.com",
  "farmerscountrymarket14@gmail.com",
  "fcm391@pvtn.net",
  "fcm483@gmail.com",
  "jbmanager262@qwestoffice.net",
  "kellyliquorbarn@gmail.com",
  "martin@farmerscountrymarket.com",
  "nmgrocers@gmail.com",
  "simminc@aol.com",
  "thesportsman.nm@hotmail.com",
  "abrown@golatitudes.com",
  "luckyslcnm@gmail.com",
  "miranda.todachine@isleta.com",
  "joe.lynam@isleta.com",
  "adrianna.jiron@isleta.com",
  "aparcio@outlook.com",
  "avtar7315@hotmail.com",
  "howard.naholowa'a@isleta.com",
  "janelle.martinez@good2gostores.com",
  "pbriscoe@indianpueblo.com",
  "bobsphillips66@gmail.com",
  "sam.dearden@good2gostores.com",
  "farmers-5@hotmail.com",
  "kellyliquorlascruces@gmail.com",
  "kellysinbsqf@gmail.com",
  "ccinvestmentsllc576@gmail.com",
  "kame.phurwa25@gmail.com",
  "jbmanager452@qwestoffice.net",
  "jbmanager268@qwestoffice.net",
  "jbmanager270@qwestoffice.net",
  "chois1118@hanmail.net",
  "casaliquor@gmail.com",
  "unerivera@gmail.com",
  "henry@novocommstrategies.com",
  "ohch4312@gmail.com",
  "mdsllcgrants@gmail.com"
];


// Email template for member credentials
const memberCredentialsTemplate = (name, email, businessName, password) => {
  const content = `
    <h2>Welcome to NMGA</h2>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
      <h3 style="margin-top: 0; color:rgb(26, 26, 26);">𝐏𝐋𝐄𝐀𝐒𝐄 𝐑𝐄𝐀𝐃: System Training Sessions</h3>
      <p style="margin-bottom: 10px;">Hello! You are getting this because you are a NMGA Co-op member and will be utilizing our new liquor co-op online system for monthly liquor commitments. We will be holding system training sessions on Tuesday 8/26/25 and on Thursday 9/6/25. On 8/26 we will have training sessions available at 10am and at 3:15pm and on 9/6 we will have training sessions at 10am and 3:15pm. Below this email, please find a link to sign up for the day and time that you can attend a training, along with the link for the meeting in Google Meets.</p>
      
      <p style="margin-bottom: 10px;">If you got the original email and have already signed in to the new system, please do not sign-up again.  We ask that you just complete the google form at the bottom of this email to sign up for the date and time of your training.  If you have any questions please email henry@novocommstrategies.com.</p>
      
      <p style="margin-bottom: 10px;">Thank you!</p>
      
      <p style="margin-bottom: 10px;"><strong>𝐈𝐌𝐏𝐎𝐑𝐓𝐀𝐍𝐓 𝐍𝐎𝐓𝐄!! 𝐒𝐲𝐬𝐭𝐞𝐦 𝐢𝐬 𝐥𝐨𝐜𝐚𝐭𝐞𝐝 𝐢𝐧 <a href="https://nmgrocers.com" style="color: #007bff;">nmgrocers.com</a> 𝐢𝐧 𝐭𝐡𝐞 𝐍𝐌 𝐆𝐫𝐨𝐜𝐞𝐫𝐬 𝐋𝐢𝐪𝐮𝐨𝐫 𝐂𝐨-𝐨𝐩 𝐭𝐚𝐛.</strong></p>
      
      <p style="margin-bottom: 10px;"><strong>Sign-up for Training Session</strong> (Please note that each session should take no more than 30-45 minutes)<br>
      Link: <a href="https://forms.gle/2obsVfrswtDFetDbA" style="color: #007bff;">https://forms.gle/2obsVfrswtDFetDbA</a></p>
      
      <p style="margin-bottom: 0;"><strong>Google Meets link for training meeting you chose:</strong><br>
      <a href="https://meet.google.com/ewz-gfoq-bvs" style="color: #007bff;">https://meet.google.com/ewz-gfoq-bvs</a></p>
    </div>
    
    <div class="alert-box alert-info">
      <h3>Your Login Credentials</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Business Name:</strong> ${businessName}</p>
      <p><strong>Password:</strong> ${password}</p>
    </div>
    
    <div class="alert-box alert-warning">
      <h3>Important Security Notice</h3>
      <p>For your security, we strongly recommend that you change your password after your first login. You can do this by:</p>
      <ol>
        <li>Logging into your account using the credentials above</li>
        <li>Going to your profile settings</li>
        <li>Selecting "Change Password"</li>
        <li>Entering a new secure password</li>
      </ol>
      <p style="padding:5px; background-color:rgb(238, 70, 70);color:white; border-radius: 5px;"><strong>Note:</strong> If you have already logged in or changed your password recently, You can login with your recent password.</p>
    </div>
    
    <div class="card">
      <h3 class="card-header">What You Can Do</h3>
      <ul>
        <li>Browse and participate in exclusive deals from distributors</li>
        <li>Access member-only content and resources</li>
        <li>Stay updated with industry news and events</li>
      </ul>
    </div>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
    
    <p>Best regards,<br>
    <strong>NMGA Team</strong></p>
  `;
  
  return baseTemplate(content);
};

// Function to read XLSX and create users
async function createQwestUsers() {
  // Reset stats
  stats.total = 0;
  stats.created = 0;
  stats.skipped = 0;
  stats.errors = 0;
  stats.emailsSent = 0;
  stats.emailsFailed = 0;
  stats.errorDetails = [];

  try {
    console.log('Starting to create users from XLSX file...');
    console.log(`XLSX file path: ${XLSX_FILE_PATH}`);
    
    // Check if XLSX file exists
    if (!fs.existsSync(XLSX_FILE_PATH)) {
      throw new Error(`XLSX file not found: ${XLSX_FILE_PATH}`);
    }
    
    // Read XLSX file and collect all users
    const xlsxUsers = [];
    
    // Read the workbook
    const workbook = xlsx.readFile(XLSX_FILE_PATH);
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets in XLSX file`);
    
    // Process each sheet
    for (const sheetName of sheetNames) {
      console.log(`Processing sheet: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const results = xlsx.utils.sheet_to_json(worksheet);
      
      console.log(`Parsed ${results.length} records from sheet ${sheetName}`);
      
      // Process each record
      for (const row of results) {
        // Check if email exists and is not in sentEmails array
        if (row.EMAIL) {
          const email = String(row.EMAIL).trim().toLowerCase();
          
          // Skip if email is empty or already sent
          if (!email || sentEmails.includes(email)) {
            console.log(`⏭️  Skipping email (already sent or empty): ${email}`);
            continue;
          }
          
          // Get name fields (use empty string if not present)
          const lastName = row.LASTNAME ? String(row.LASTNAME).trim() : '';
          const firstName = row.FIRSTNAME ? String(row.FIRSTNAME).trim() : '';
          
          // Create user object (even if name fields are empty)
          xlsxUsers.push({
            email: email,
            firstName: firstName || 'User',
            lastName: lastName || '',
            name: firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || email.split('@')[0]),
            businessName: 'NMGA Co-op Member',
            contactPerson: firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || email.split('@')[0]),
            phone: 'N/A'
          });
        }
      }
    }
    
    console.log(`✓ XLSX file read successfully. Found ${xlsxUsers.length} users to process (excluding ${sentEmails.length} already sent emails).`);
    
    stats.total = xlsxUsers.length;
    console.log(`Total users to process: ${stats.total}`);
    console.log(`Already sent emails excluded: ${sentEmails.length}`);
    
    if (stats.total === 0) {
      console.log('No new users found in XLSX file (all emails have already been sent).');
      return {
        success: true,
        stats: {
          total: 0,
          created: 0,
          skipped: 0,
          errors: 0,
          emailsSent: 0,
          emailsFailed: 0,
          errorDetails: []
        }
      };
    }
    
    // Default password (same as register route)
    const defaultPassword = 'changeme123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Process each user from XLSX
    for (const userData of xlsxUsers) {
      try {
        console.log(`\nProcessing: ${userData.name} (${userData.email})`);
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⏭️  Skipped existing user: ${userData.name}`);
          stats.skipped++;
        } else {
          // Create new user (same pattern as register route)
          const loginKey = await generateUniqueLoginKey(User);
          
          const newUser = new User({
            email: userData.email,
            name: userData.name,
            businessName: userData.businessName,
            contactPerson: userData.contactPerson,
            phone: userData.phone,
            password: hashedPassword,
            role: 'member',
            login_key: loginKey,
            address: '',
            logo: '',
            isVerified: true
          });
          
          await newUser.save();
          console.log(`✓ Created new user: ${userData.name}`);
          stats.created++;
        }
        
        // Send credentials email to ALL CSV users (regardless of whether they were created or skipped)
        try {
          const emailContent = memberCredentialsTemplate(
            userData.name,
            userData.email,
            userData.businessName,
            defaultPassword
          );
          
          await sendEmail(
            userData.email,
            'NMGA - Your Account Credentials',
            emailContent
          );
          
          console.log(`✓ Credentials email sent to: ${userData.name}`);
          stats.emailsSent++;
          
          // Add a small delay to avoid overwhelming the email service
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (emailError) {
          console.error(`✗ Failed to send email to ${userData.name}:`, emailError.message);
          stats.emailsFailed++;
          stats.errorDetails.push({
            user: userData.name,
            email: userData.email,
            error: `Email sending failed: ${emailError.message}`
          });
        }
        
      } catch (error) {
        console.error(`✗ Error processing ${userData.name}:`, error.message);
        stats.errors++;
        stats.errorDetails.push({
          user: userData.name,
          email: userData.email,
          error: error.message
        });
      }
    }
    
    // Print summary
    console.log('\n======= XLSX USERS CREATION COMPLETED =======');
    console.log(`Total users processed: ${stats.total}`);
    console.log(`Users created: ${stats.created}`);
    console.log(`Users skipped (already exist): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Credentials emails sent: ${stats.emailsSent}`);
    console.log(`Email sending failed: ${stats.emailsFailed}`);
    
    if (stats.errorDetails.length > 0) {
      console.log('\nErrors encountered:');
      stats.errorDetails.forEach((error, index) => {
        console.log(`${index + 1}. ${error.user} (${error.email}): ${error.error}`);
      });
    }
    
    return {
      success: true,
      stats: {
        total: stats.total,
        created: stats.created,
        skipped: stats.skipped,
        errors: stats.errors,
        emailsSent: stats.emailsSent,
        emailsFailed: stats.emailsFailed,
        errorDetails: stats.errorDetails
      }
    };
    
  } catch (error) {
    console.error('Error in createQwestUsers:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Export the function for use in routes
module.exports = { createQwestUsers };

// If script is run directly, execute the creation process
if (require.main === module) {
  // Connect to MongoDB
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(async () => {
    console.log('MongoDB connected successfully');
    
    // Confirm before creating users and sending emails
    console.log('\n⚠️  WARNING: This will read users from XLSX file and send credentials to NEW users only.');
    console.log(`XLSX file: ${XLSX_FILE_PATH}`);
    console.log('Make sure your XLSX file has the following headers: EMAIL, LASTNAME, FIRSTNAME');
    console.log(`Already sent emails excluded: ${sentEmails.length} emails`);
    console.log('\nPress Ctrl+C to cancel or wait 5 seconds to continue...');
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const result = await createQwestUsers();
    
    if (result.success) {
      console.log('\n✅ XLSX users creation process completed successfully!');
    } else {
      console.log('\n❌ XLSX users creation process failed:', result.error);
    }
    
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}
