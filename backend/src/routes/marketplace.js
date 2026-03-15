const express = require('express');
const router = express.Router();
const { CarbonCredit, Listing, Transaction } = require('../models/Credit');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/marketplace/listings - Browse all active listings
router.get('/listings', protect, async (req, res) => {
  try {
    const { page = 1, limit = 12, minPrice, maxPrice, seller } = req.query;
    const filter = { status: 'active' };
    if (minPrice || maxPrice) {
      filter.pricePerCredit = {};
      if (minPrice) filter.pricePerCredit.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerCredit.$lte = parseFloat(maxPrice);
    }
    if (seller) filter.seller = seller;

    const listings = await Listing.find(filter)
      .populate('seller', 'name email district role avatar companyName')
      .populate({ path: 'credit', populate: { path: 'activity', select: 'type title' } })
      .sort({ listedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(filter);
    res.json({ success: true, listings, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/marketplace/list - List credits for sale
router.post('/list', protect, async (req, res) => {
  try {
    const { creditId, creditAmount, pricePerCredit, description } = req.body;

    const credit = await CarbonCredit.findOne({ _id: creditId, owner: req.user._id, status: 'active' });
    if (!credit) return res.status(404).json({ success: false, message: 'Credit not found or not owned by you' });

    if (credit.amount < creditAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient credit balance' });
    }

    // Mark credit as listed
    credit.status = 'listed';
    await credit.save();

    const listing = await Listing.create({
      seller: req.user._id,
      credit: credit._id,
      creditAmount: parseFloat(creditAmount),
      pricePerCredit: parseFloat(pricePerCredit),
      description,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    res.status(201).json({ success: true, message: 'Credits listed for sale', listing });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/marketplace/buy/:listingId - Buy credits
router.post('/buy/:listingId', protect, authorize('company', 'citizen', 'admin'), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.listingId).populate('seller');
    if (!listing || listing.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Listing not available' });
    }

    if (listing.seller._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot buy your own listing' });
    }

    const buyer = await User.findById(req.user._id);
    if (buyer.walletBalance < listing.totalPrice) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Process transaction
    listing.status = 'sold';
    listing.buyer = req.user._id;
    listing.soldAt = new Date();
    listing.transactionId = `TXN${Date.now()}`;
    await listing.save();

    // Transfer credit ownership
    const credit = await CarbonCredit.findById(listing.credit);
    credit.owner = req.user._id;
    credit.status = 'active';
    await credit.save();

    // Update balances
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: -listing.totalPrice, carbonCredits: listing.creditAmount },
      $push: { creditsOwned: credit._id }
    });
    await User.findByIdAndUpdate(listing.seller._id, {
      $inc: { walletBalance: listing.totalPrice, carbonCredits: -listing.creditAmount }
    });

    // Record transactions
    await Transaction.create([
      {
        type: 'credit_bought', user: req.user._id, counterparty: listing.seller._id,
        credit: credit._id, listing: listing._id, amount: listing.creditAmount,
        value: listing.totalPrice, description: `Purchased ${listing.creditAmount} carbon credits`
      },
      {
        type: 'credit_sold', user: listing.seller._id, counterparty: req.user._id,
        credit: credit._id, listing: listing._id, amount: listing.creditAmount,
        value: listing.totalPrice, description: `Sold ${listing.creditAmount} carbon credits`
      }
    ]);

    // Notify via socket
    const io = req.app.get('io');
    io.to(listing.seller._id.toString()).emit('credit-sold', { amount: listing.creditAmount, value: listing.totalPrice });

    res.json({
      success: true,
      message: 'Credits purchased successfully',
      transaction: { amount: listing.creditAmount, value: listing.totalPrice, txId: listing.transactionId }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/marketplace/cancel/:listingId
router.delete('/cancel/:listingId', protect, async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.listingId, seller: req.user._id });
    if (!listing) return res.status(404).json({ success: false, message: 'Listing not found' });

    listing.status = 'cancelled';
    await listing.save();

    await CarbonCredit.findByIdAndUpdate(listing.credit, { status: 'active' });
    res.json({ success: true, message: 'Listing cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
