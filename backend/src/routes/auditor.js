const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');
const { protect, authorize, requireAuditorApproval } = require('../middleware/auth');
const { issueCarbonCredits } = require('./activities');

// GET /api/auditor/pending - Get pending activities for review
router.get('/pending', protect, authorize('auditor', 'admin'), requireAuditorApproval, async (req, res) => {
  try {
    const { lat, lng, radius = 100000, page = 1, limit = 20 } = req.query;
    const filter = { verificationStatus: { $in: ['pending', 'ai_verified'] } };

    const activities = await Activity.find(filter)
      .populate('user', 'name email role district avatar')
      .sort({ submittedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments(filter);
    res.json({ success: true, activities, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auditor/verify/:id - Approve or reject activity
router.put('/verify/:id', protect, authorize('auditor', 'admin'), requireAuditorApproval, async (req, res) => {
  try {
    const { decision, note } = req.body; // decision: 'approve' | 'reject'

    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });

    if (!['pending', 'ai_verified'].includes(activity.verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Activity already reviewed' });
    }

    activity.auditor = req.user._id;
    activity.auditorNote = note;
    activity.auditorVerifiedAt = new Date();

    if (decision === 'approve') {
      activity.verificationStatus = 'approved';
      activity.adminApproved = true;

      // Issue carbon credits
      const credit = await issueCarbonCredits(activity);

      // Notify user
      const io = req.app.get('io');
      io.to(activity.user.toString()).emit('activity-approved', {
        activityId: activity._id,
        creditsEarned: activity.carbonCreditsEarned,
        carbonSaved: activity.carbonSaved
      });

      await activity.save();

      return res.json({
        success: true,
        message: 'Activity approved and carbon credits issued',
        activity,
        creditsIssued: credit?.amount || 0
      });
    } else {
      activity.verificationStatus = 'rejected';
      await activity.save();

      // Notify user
      const io = req.app.get('io');
      io.to(activity.user.toString()).emit('activity-rejected', {
        activityId: activity._id,
        reason: note
      });

      return res.json({ success: true, message: 'Activity rejected', activity });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auditor/stats
router.get('/stats', protect, authorize('auditor', 'admin'), async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      Activity.countDocuments({ verificationStatus: { $in: ['pending', 'ai_verified'] } }),
      Activity.countDocuments({ verificationStatus: 'approved' }),
      Activity.countDocuments({ verificationStatus: 'rejected' }),
      Activity.countDocuments()
    ]);

    res.json({ success: true, stats: { pending, approved, rejected, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
