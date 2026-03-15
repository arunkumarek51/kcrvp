const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['tree_planting', 'solar_energy', 'ev_driving', 'organic_farming'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },

  // Quantity inputs
  quantity: { type: Number, required: true }, // trees / kWh / km / acres
  unit: { type: String }, // trees, kWh, km, acres

  // Media
  photos: [{ url: String, publicId: String }],
  videoUrl: { type: String },

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }, // [lng, lat]
    address: { type: String },
    district: { type: String },
    state: { type: String, default: 'Kerala' }
  },

  // Carbon calculation
  carbonSaved: { type: Number, default: 0 }, // kg CO2
  carbonCreditsEarned: { type: Number, default: 0 },

  // AI Verification
  aiVerification: {
    analyzed: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 }, // 0-100
    detectedObjects: [String],
    verificationStatus: {
      type: String,
      enum: ['pending', 'passed', 'failed'],
      default: 'pending'
    },
    analysisDetails: { type: String }
  },

  // Human Verification
  verificationStatus: {
    type: String,
    enum: ['pending', 'ai_verified', 'auditor_verified', 'approved', 'rejected'],
    default: 'pending'
  },
  auditor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  auditorNote: { type: String },
  auditorVerifiedAt: { type: Date },

  // Admin
  adminApproved: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  flagReason: { type: String },

  // Duplicate detection
  nearbySubmissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],

  // Blockchain
  blockchainTxHash: { type: String },
  blockchainRecorded: { type: Boolean, default: false },

  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

activitySchema.index({ location: '2dsphere' });
activitySchema.index({ user: 1, type: 1 });
activitySchema.index({ verificationStatus: 1 });

// Carbon calculation based on activity type
activitySchema.methods.calculateCarbon = function() {
  const rates = {
    tree_planting: 22,       // kg CO2 per tree per year
    solar_energy: 0.85,      // kg CO2 per kWh
    ev_driving: 0.12,        // kg CO2 per km
    organic_farming: 200     // kg CO2 per acre per year
  };
  this.carbonSaved = this.quantity * (rates[this.type] || 0);
  this.carbonCreditsEarned = this.carbonSaved / 1000;
  return this.carbonSaved;
};

module.exports = mongoose.model('Activity', activitySchema);
