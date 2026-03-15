const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['citizen', 'farmer', 'auditor', 'company', 'admin'],
    default: 'citizen'
  },
  phone: { type: String },
  district: { type: String },
  state: { type: String, default: 'Kerala' },
  avatar: { type: String },
  bio: { type: String },

  // Carbon data
  totalCarbonSaved: { type: Number, default: 0 }, // in kg CO2
  carbonCredits: { type: Number, default: 0 },
  sustainabilityScore: { type: Number, default: 0 }, // 0-100

  // Wallet
  walletAddress: { type: String },
  walletBalance: { type: Number, default: 0 }, // in INR

  // Status
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  auditorApproved: { type: Boolean, default: false },

  // Stats
  totalActivities: { type: Number, default: 0 },
  treesPlanted: { type: Number, default: 0 },
  solarKwh: { type: Number, default: 0 },
  evKmDriven: { type: Number, default: 0 },
  farmingAcres: { type: Number, default: 0 },

  // Company specific
  companyName: { type: String },
  gstNumber: { type: String },
  creditsOwned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CarbonCredit' }],

  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate sustainability score
userSchema.methods.calculateSustainabilityScore = function() {
  const score = Math.min(100, Math.floor(
    (this.totalCarbonSaved / 1000) * 20 +
    (this.totalActivities * 2) +
    (this.carbonCredits * 5)
  ));
  this.sustainabilityScore = score;
  return score;
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
