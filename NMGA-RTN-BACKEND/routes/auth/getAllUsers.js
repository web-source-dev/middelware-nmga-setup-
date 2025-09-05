const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { isAdmin } = require('../../middleware/auth');

router.get('/', isAdmin, async (req, res) => {
  try {
    const users = await User.find({});
    res.json({ users, message: 'Users fetched successfully', success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', success: false });
  }
});

module.exports = router;
