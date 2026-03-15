// blockchain.js
const express = require('express');
const router = express.Router();
const { CarbonCredit } = require('../models/Credit');
const { protect } = require('../middleware/auth');

// Mock blockchain recording (replace with real ethers.js in production)
router.post('/record/:creditId', protect, async (req, res) => {
  try {
    const credit = await CarbonCredit.findOne({ _id: req.params.creditId, owner: req.user._id });
    if (!credit) return res.status(404).json({ success: false, message: 'Credit not found' });
    if (credit.isOnChain) return res.status(400).json({ success: false, message: 'Already recorded on blockchain' });

    // Simulate blockchain recording
    const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    credit.blockchainTxHash = mockTxHash;
    credit.isOnChain = true;
    credit.tokenId = `${Date.now()}`;
    await credit.save();

    res.json({
      success: true,
      message: 'Credit recorded on blockchain',
      txHash: mockTxHash,
      network: 'Polygon Mumbai Testnet',
      explorerUrl: `https://mumbai.polygonscan.com/tx/${mockTxHash}`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/verify/:txHash', async (req, res) => {
  try {
    const credit = await CarbonCredit.findOne({ blockchainTxHash: req.params.txHash })
      .populate('owner', 'name walletAddress');
    if (!credit) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, credit, verified: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
