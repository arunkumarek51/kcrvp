// admin.js
const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');
const { CarbonCredit } = require('../models/Credit');
const { protect, authorize } = require('../middleware/auth');

// GET /api/admin/users
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const users = await User.find(filter).select('-password')
      .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, users, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/approve-auditor/:userId
router.put('/approve-auditor/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { auditorApproved: true },
      { new: true }
    ).select('-password');
    res.json({ success: true, message: 'Auditor approved', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/toggle-user/:userId
router.put('/toggle-user/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/flagged
router.get('/flagged', protect, authorize('admin'), async (req, res) => {
  try {
    const flagged = await Activity.find({ isFlagged: true })
      .populate('user', 'name email district')
      .sort({ submittedAt: -1 });
    res.json({ success: true, activities: flagged });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/add-balance/:userId
router.put('/add-balance/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $inc: { walletBalance: parseFloat(amount) } },
      { new: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
