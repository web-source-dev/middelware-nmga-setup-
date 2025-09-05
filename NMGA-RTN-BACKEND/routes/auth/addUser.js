const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Log = require('../../models/Logs');
const sendEmail = require('../../utils/email');
const InvitationEmail = require('../../utils/EmailTemplates/InvitationEmail');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { importUsers } = require('../../importUsers');
const { generateUniqueLoginKey } = require('../../utils/loginKeyGenerator');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Import users from Excel file
router.post('/import-users', async (req, res) => {
    try {
        // Check if user is admin
        const userRole = req.headers['user-role'];
        if (userRole !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only administrators can import users' });
        }
        
        // Call the import function
        const result = await importUsers();
        
        // Return response
        if (result.success) {
            res.status(200).json({ 
                success: true, 
                message: 'Users imported successfully', 
                stats: result.stats 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to import users', 
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during import', 
            error: error.message 
        });
    }
});

router.post('/add-user', async (req, res) => {
    const { name, email, role, businessName } = req.body;
    try {
        const user = new User({ name, email, role, businessName });
        await user.save();
        await Log.create({ 
            message: `System administrator successfully created a new ${role} account for ${name}`,
            type: 'success', 
            user_id: user._id
        });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        const loginKey = await generateUniqueLoginKey(User);
        console.log('loginKey', loginKey);
        user.login_key = loginKey;
        await user.save();

        console.log('user', user);

        const emailContent = InvitationEmail(token);
        await sendEmail(email, 'Invitation to NMGA', emailContent);

        res.status(200).json({ message: 'User added successfully' });
    } catch (error) {
        console.error('Error adding user:', error);
        await Log.create({ 
            message: `Account creation failed for ${name} (${role}): ${error.message}`,
            type: 'error'
        });
        res.status(500).json({ message: 'Error adding user' });
    }
});

router.post('/create-password', async (req, res) => {
    const { token, password } = req.body;
    try {
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        await Log.create({ 
            message: `Account setup completed: ${user.name} has configured their authentication credentials`,
            type: 'success',
            user_id: user._id
        });

        res.status(200).json({ message: 'Password has been updated.' });
    } catch (error) {
        console.error('Error creating password:', error);
        await Log.create({ 
            message: `Account setup failed: Unable to configure authentication for ${user.name}. ${error.message}`,
            type: 'error'
        });
        res.status(500).json({ message: 'Error creating password' });
    }
});

module.exports = router;
