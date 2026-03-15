// users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/profile/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/auditors', protect, async (req, res) => {
  try {
    const auditors = await User.find({ role: 'auditor', auditorApproved: true })
      .select('name email district sustainabilityScore totalActivities');
    res.json({ success: true, auditors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
