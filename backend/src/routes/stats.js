const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const User = require('../models/User');
const { CarbonCredit, Listing } = require('../models/Credit');
const { protect } = require('../middleware/auth');

// GET /api/stats/platform - Platform-wide stats
router.get('/platform', async (req, res) => {
  try {
    const [
      totalUsers, totalActivities, approvedActivities,
      totalCreditsResult, totalCarbonResult, activeListings
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Activity.countDocuments(),
      Activity.countDocuments({ verificationStatus: 'approved' }),
      CarbonCredit.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Activity.aggregate([
        { $match: { verificationStatus: 'approved' } },
        { $group: { _id: null, total: { $sum: '$carbonSaved' } } }
      ]),
      Listing.countDocuments({ status: 'active' })
    ]);

    // Activity type breakdown
    const activityBreakdown = await Activity.aggregate([
      { $match: { verificationStatus: 'approved' } },
      { $group: { _id: '$type', count: { $sum: 1 }, carbonSaved: { $sum: '$carbonSaved' } } }
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Activity.aggregate([
      { $match: { submittedAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$submittedAt' }, month: { $month: '$submittedAt' } },
        activities: { $sum: 1 },
        carbonSaved: { $sum: '$carbonSaved' }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // District breakdown
    const districtStats = await Activity.aggregate([
      { $match: { verificationStatus: 'approved', 'location.district': { $exists: true } } },
      { $group: { _id: '$location.district', activities: { $sum: 1 }, carbonSaved: { $sum: '$carbonSaved' } } },
      { $sort: { carbonSaved: -1 } },
      { $limit: 14 }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalActivities,
        approvedActivities,
        totalCredits: totalCreditsResult[0]?.total || 0,
        totalCarbonSaved: totalCarbonResult[0]?.total || 0,
        activeListings,
        activityBreakdown,
        monthlyTrend,
        districtStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stats/user/:userId - User-specific stats
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId === 'me' ? req.user._id : req.params.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [activities, carbonByType, monthlyActivity] = await Promise.all([
      Activity.find({ user: userId }).sort({ submittedAt: -1 }).limit(10),
      Activity.aggregate([
        { $match: { user: user._id, verificationStatus: 'approved' } },
        { $group: { _id: '$type', count: { $sum: 1 }, carbonSaved: { $sum: '$carbonSaved' }, credits: { $sum: '$carbonCreditsEarned' } } }
      ]),
      Activity.aggregate([
        { $match: { user: user._id } },
        { $group: {
          _id: { year: { $year: '$submittedAt' }, month: { $month: '$submittedAt' } },
          activities: { $sum: 1 },
          carbonSaved: { $sum: '$carbonSaved' }
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);

    const credits = await CarbonCredit.find({ owner: userId, status: 'active' });
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    res.json({
      success: true,
      user,
      stats: {
        totalActivities: activities.length,
        totalCarbonSaved: user.totalCarbonSaved,
        carbonCredits: totalCredits,
        sustainabilityScore: user.sustainabilityScore,
        carbonByType,
        monthlyActivity,
        recentActivities: activities
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stats/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const leaders = await User.find({ isActive: true })
      .select('name email role district avatar totalCarbonSaved carbonCredits sustainabilityScore totalActivities')
      .sort({ totalCarbonSaved: -1 })
      .limit(20);

    res.json({ success: true, leaderboard: leaders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
