const mongoose = require('mongoose');

// Carbon Credit
const carbonCreditSchema = new mongoose.Schema({
  creditId: { type: String, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },

  amount: { type: Number, required: true }, // carbon credits
  co2Equivalent: { type: Number }, // kg CO2

  status: {
    type: String,
    enum: ['active', 'listed', 'sold', 'retired'],
    default: 'active'
  },

  // Blockchain
  tokenId: { type: String },
  blockchainTxHash: { type: String },
  contractAddress: { type: String },
  isOnChain: { type: Boolean, default: false },

  vintage: { type: String }, // Year of carbon offset e.g. "2024"
  standard: { type: String, default: 'KCRVP-V1' },
  serialNumber: { type: String, unique: true },

  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}, { timestamps: true });

carbonCreditSchema.pre('save', function(next) {
  if (!this.creditId) {
    this.creditId = `KCRVP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  if (!this.serialNumber) {
    this.serialNumber = `KRC${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }
  if (!this.vintage) {
    this.vintage = new Date().getFullYear().toString();
  }
  next();
});

// Marketplace Listing
const listingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  credit: { type: mongoose.Schema.Types.ObjectId, ref: 'CarbonCredit', required: true },

  creditAmount: { type: Number, required: true },
  pricePerCredit: { type: Number, required: true }, // INR
  totalPrice: { type: Number },
  currency: { type: String, default: 'INR' },

  status: {
    type: String,
    enum: ['active', 'sold', 'cancelled', 'expired'],
    default: 'active'
  },

  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  soldAt: { type: Date },
  transactionId: { type: String },

  description: { type: String },
  tags: [String],

  expiresAt: { type: Date },
  listedAt: { type: Date, default: Date.now }
}, { timestamps: true });

listingSchema.pre('save', function(next) {
  this.totalPrice = this.creditAmount * this.pricePerCredit;
  next();
});

// Transaction
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit_earned', 'credit_sold', 'credit_bought', 'credit_retired'],
    required: true
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counterparty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  credit: { type: mongoose.Schema.Types.ObjectId, ref: 'CarbonCredit' },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },

  amount: { type: Number }, // credits
  value: { type: Number }, // INR
  blockchainTxHash: { type: String },

  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  CarbonCredit: mongoose.model('CarbonCredit', carbonCreditSchema),
  Listing: mongoose.model('Listing', listingSchema),
  Transaction: mongoose.model('Transaction', transactionSchema)
};
