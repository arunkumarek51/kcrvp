// credits.js
const express = require('express');
const router = express.Router();
const { CarbonCredit, Transaction } = require('../models/Credit');
const { protect } = require('../middleware/auth');

router.get('/my', protect, async (req, res) => {
  try {
    const credits = await CarbonCredit.find({ owner: req.user._id })
      .populate({ path: 'activity', select: 'type title carbonSaved submittedAt' })
      .sort({ issuedAt: -1 });
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('counterparty', 'name email').sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, credits, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
