const express = require('express');
const router = express.Router();
const multer = require('multer');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { CarbonCredit, Transaction } = require('../models/Credit');
const { protect, authorize } = require('../middleware/auth');
const { verifyActivityImage, checkDuplicateLocation } = require('../services/aiVerification');

// Multer config (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// Mock Cloudinary upload (returns placeholder in development)
async function uploadToCloud(buffer, folder) {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const cloudinary = require('cloudinary').v2;
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder }, (err, result) => {
        if (err) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }).end(buffer);
    });
  }
  // Return placeholder URL
  return {
    url: `https://picsum.photos/seed/${Date.now()}/800/600`,
    publicId: `mock_${Date.now()}`
  };
}

// GET /api/activities - Get all activities (with filters)
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 10, userId } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.verificationStatus = status;
    if (userId) filter.user = userId;

    // Non-admin users see only their own or approved activities
    if (!['admin', 'auditor'].includes(req.user.role)) {
      filter.$or = [{ user: req.user._id }, { verificationStatus: 'approved' }];
    }

    const skip = (page - 1) * limit;
    const activities = await Activity.find(filter)
      .populate('user', 'name email role district avatar')
      .populate('auditor', 'name email')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments(filter);

    res.json({ success: true, activities, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activities/my - Get current user's activities
router.get('/my', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const activities = await Activity.find({ user: req.user._id })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Activity.countDocuments({ user: req.user._id });
    res.json({ success: true, activities, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activities/map - Get activities for map view
router.get('/map', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 50000, type } = req.query;
    const filter = { verificationStatus: { $in: ['approved', 'auditor_verified'] } };
    if (type) filter.type = type;

    let activities;
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      };
    }

    activities = await Activity.find(filter)
      .populate('user', 'name role district')
      .select('type title location carbonSaved carbonCreditsEarned verificationStatus submittedAt user photos')
      .limit(200);

    res.json({ success: true, activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/activities - Submit new activity
router.post('/', protect, upload.array('photos', 5), async (req, res) => {
  try {
    const { type, title, description, quantity, lat, lng, address, district } = req.body;

    // Upload photos
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloud(file.buffer, 'kcrvp/activities');
        photos.push(result);
      }
    }

    // Check for duplicate locations
    const coordinates = lat && lng ? [parseFloat(lng), parseFloat(lat)] : null;
    const duplicates = coordinates
      ? await checkDuplicateLocation(Activity, coordinates, req.user._id, 50)
      : [];

    // Create activity
    const activity = new Activity({
      user: req.user._id,
      type, title, description,
      quantity: parseFloat(quantity),
      photos,
      location: coordinates ? {
        type: 'Point',
        coordinates,
        address, district,
        state: 'Kerala'
      } : undefined,
      nearbySubmissions: duplicates.map(d => d._id),
      isFlagged: duplicates.length > 0
    });

    // Calculate carbon
    activity.calculateCarbon();

    // AI Verification (run in background)
    if (photos.length > 0) {
      const aiResult = await verifyActivityImage(photos[0].url, type);
      activity.aiVerification = aiResult;
      if (aiResult.verificationStatus === 'passed') {
        activity.verificationStatus = 'ai_verified';
      }
    }

    await activity.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalActivities: 1,
        ...(type === 'tree_planting' && { treesPlanted: parseFloat(quantity) }),
        ...(type === 'solar_energy' && { solarKwh: parseFloat(quantity) }),
        ...(type === 'ev_driving' && { evKmDriven: parseFloat(quantity) }),
        ...(type === 'organic_farming' && { farmingAcres: parseFloat(quantity) })
      }
    });

    // Notify via socket
    const io = req.app.get('io');
    io.to(req.user._id.toString()).emit('activity-submitted', {
      activityId: activity._id,
      carbonSaved: activity.carbonSaved,
      aiConfidence: activity.aiVerification.confidence
    });

    res.status(201).json({
      success: true,
      message: 'Activity submitted successfully',
      activity,
      aiVerification: activity.aiVerification,
      isDuplicate: duplicates.length > 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/activities/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('user', 'name email role district avatar')
      .populate('auditor', 'name email');
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    res.json({ success: true, activity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// When activity is approved, issue carbon credits
async function issueCarbonCredits(activity) {
  if (activity.carbonCreditsEarned <= 0) return null;

  const credit = await CarbonCredit.create({
    owner: activity.user,
    originalOwner: activity.user,
    activity: activity._id,
    amount: activity.carbonCreditsEarned,
    co2Equivalent: activity.carbonSaved,
    status: 'active'
  });

  // Update user wallet
  await User.findByIdAndUpdate(activity.user, {
    $inc: {
      totalCarbonSaved: activity.carbonSaved,
      carbonCredits: activity.carbonCreditsEarned
    }
  });

  // Record transaction
  await Transaction.create({
    type: 'credit_earned',
    user: activity.user,
    credit: credit._id,
    amount: activity.carbonCreditsEarned,
    description: `Credits earned from ${activity.type} activity`
  });

  return credit;
}

module.exports = router;
module.exports.issueCarbonCredits = issueCarbonCredits;
