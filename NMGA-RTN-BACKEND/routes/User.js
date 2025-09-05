// Get list of distributors for admin

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAdmin } = require('../middleware/auth');
const Log = require('../models/Logs');


router.get('/distributor-list', isAdmin, async (req, res) => {
    try {
        const distributors = await User.find({ role: 'distributor' })
            .select('name email businessName')
            .sort({ businessName: 1, name: 1 });

        res.json({
            success: true,
            distributors
        });
    } catch (error) {
        console.error('Error fetching distributors:', error);
        res.status(500).json({ success: false, message: 'Error fetching distributors' });
    }
}); 


// Get user data by ID (admin only)
router.get('/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params; // Get the user ID from URL parameter
      
      const user = await User.findById(id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Error fetching user data' });
    }
  });
  
  // Update user data by ID (admin only)
  router.put('/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params; // Get the user ID from URL parameter
      
      const updates = req.body;
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      await Log.create({
        message: `Admin updated profile for user ${updatedUser.name} (${updatedUser.email})`,
        type: 'info',
        user_id: id
      });
  
     
  
      res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
      console.error('Error updating user data:', error);
      res.status(500).json({ message: 'Error updating user data' });
    }
  });
  
  router.post('/password/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params; // Get the user ID from URL parameter
      
      const { oldPassword, newPassword } = req.body;
  
      // Find the user by ID
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Compare old password with hashed password
      const bcrypt = require('bcrypt');
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Incorrect old password' });
      }

      await Log.create({
        message: `Admin updated password for user ${user.name} (${user.email})`,
        type: 'info',
        user_id: id
      });
  
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
      // Update user's password
      user.password = hashedPassword;
      await user.save();
  
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error updating password:', error);
      res.status(500).json({ message: 'Error updating password' });
    }
  });
  
  // Update user avatar by ID (admin only)
  router.post('/avatar/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params; // Get the user ID from URL parameter
        
        const { avatar } = req.body; // Get the avatar URL from the request body
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { logo: avatar }, // Update the logo field with the new avatar URL
            { new: true, runValidators: true }
        ).select('-password');
  
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
  
        await Log.create({
            message: `Admin updated avatar for user ${updatedUser.name} (${updatedUser.email})`,
            type: 'info',
            user_id: id
          });
  
        res.json({ message: 'Avatar updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ message: 'Error updating avatar' });
    }
  });

module.exports = router;