require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { CarbonCredit, Listing } = require('../models/Credit');

const KERALA_DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
  'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
  'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kcrvp');
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([User.deleteMany(), Activity.deleteMany(), CarbonCredit.deleteMany(), Listing.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // Create users
  const usersData = [
    { name: 'Admin User', email: 'admin@kcrvp.in', password: 'admin123', role: 'admin', district: 'Ernakulam', isVerified: true },
    { name: 'Rajan Auditor', email: 'auditor@kcrvp.in', password: 'auditor123', role: 'auditor', district: 'Thrissur', auditorApproved: true, isVerified: true },
    { name: 'Priya Nair', email: 'farmer@kcrvp.in', password: 'farmer123', role: 'farmer', district: 'Palakkad', isVerified: true, walletBalance: 5000 },
    { name: 'Arun Kumar', email: 'citizen@kcrvp.in', password: 'citizen123', role: 'citizen', district: 'Kozhikode', isVerified: true, walletBalance: 10000 },
    { name: 'GreenTech Corp', email: 'company@kcrvp.in', password: 'company123', role: 'company', district: 'Ernakulam', companyName: 'GreenTech Solutions Kerala', walletBalance: 100000 },
    ...KERALA_DISTRICTS.map((d, i) => ({
      name: `${d} Farmer ${i+1}`, email: `farmer${i+1}@kcrvp.in`, password: 'password123',
      role: i % 3 === 0 ? 'farmer' : 'citizen', district: d, walletBalance: Math.floor(Math.random() * 5000)
    }))
  ];

  const users = await User.insertMany(usersData.map(u => ({ ...u })));

  // Pre-hash passwords
  const bcrypt = require('bcryptjs');
  for (const user of users) {
    user.password = await bcrypt.hash(
      usersData.find(u => u.email === user.email)?.password || 'password123', 12
    );
    user.walletAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
    await user.save();
  }
  console.log(`✅ Created ${users.length} users`);

  // Create activities
  const activityTypes = ['tree_planting', 'solar_energy', 'ev_driving', 'organic_farming'];
  const activities = [];

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const status = i < 30 ? 'approved' : i < 40 ? 'ai_verified' : 'pending';

    const quantityRanges = {
      tree_planting: [5, 200],
      solar_energy: [50, 500],
      ev_driving: [100, 2000],
      organic_farming: [0.5, 10]
    };
    const [min, max] = quantityRanges[type];
    const quantity = Math.floor(Math.random() * (max - min)) + min;

    const titles = {
      tree_planting: `Planted trees in ${user.district}`,
      solar_energy: `Solar panel energy generation`,
      ev_driving: `Electric vehicle commute`,
      organic_farming: `Organic farming in ${user.district}`
    };

    // Kerala coordinates
    const keralaBounds = { latMin: 8.18, latMax: 12.78, lngMin: 74.86, lngMax: 77.42 };
    const lat = keralaBounds.latMin + Math.random() * (keralaBounds.latMax - keralaBounds.latMin);
    const lng = keralaBounds.lngMin + Math.random() * (keralaBounds.lngMax - keralaBounds.lngMin);

    const activity = new Activity({
      user: user._id,
      type, title: titles[type],
      description: `${type.replace('_', ' ')} activity contributing to Kerala's green initiative`,
      quantity,
      photos: [{ url: `https://picsum.photos/seed/${i+100}/800/600`, publicId: `seed_${i}` }],
      location: { type: 'Point', coordinates: [lng, lat], district: user.district, state: 'Kerala' },
      verificationStatus: status,
      adminApproved: status === 'approved',
      aiVerification: {
        analyzed: true,
        confidence: 70 + Math.floor(Math.random() * 25),
        verificationStatus: 'passed',
        detectedObjects: ['tree', 'vegetation', 'nature'].slice(0, 2)
      },
      submittedAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
    });
    activity.calculateCarbon();
    activities.push(activity);
  }

  await Activity.insertMany(activities);
  console.log(`✅ Created ${activities.length} activities`);

  // Create carbon credits for approved activities
  const approvedActivities = activities.filter(a => a.verificationStatus === 'approved');
  const credits = [];
  for (const act of approvedActivities) {
    if (act.carbonCreditsEarned > 0) {
      const credit = new CarbonCredit({
        owner: act.user,
        originalOwner: act.user,
        activity: act._id,
        amount: act.carbonCreditsEarned,
        co2Equivalent: act.carbonSaved,
        status: 'active'
      });
      credits.push(credit);

      // Update user
      await User.findByIdAndUpdate(act.user, {
        $inc: { totalCarbonSaved: act.carbonSaved, carbonCredits: act.carbonCreditsEarned }
      });
    }
  }

  await CarbonCredit.insertMany(credits);
  console.log(`✅ Created ${credits.length} carbon credits`);

  // Create some marketplace listings
  const activeCredits = credits.filter(c => c.amount > 0.01).slice(0, 10);
  for (const credit of activeCredits) {
    credit.status = 'listed';
    await credit.save();
    await Listing.create({
      seller: credit.owner,
      credit: credit._id,
      creditAmount: credit.amount,
      pricePerCredit: 800 + Math.floor(Math.random() * 400), // ₹800-1200 per credit
      description: 'Verified Kerala carbon credits',
      tags: ['Kerala', 'verified', 'renewable'],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
  }
  console.log('✅ Created marketplace listings');

  // Update sustainability scores
  await User.find({ isActive: true }).then(async (allUsers) => {
    for (const u of allUsers) {
      u.calculateSustainabilityScore();
      await u.save({ validateBeforeSave: false });
    }
  });

  console.log('\n🎉 Seed complete! Demo credentials:');
  console.log('  Admin:   admin@kcrvp.in / admin123');
  console.log('  Auditor: auditor@kcrvp.in / auditor123');
  console.log('  Farmer:  farmer@kcrvp.in / farmer123');
  console.log('  Citizen: citizen@kcrvp.in / citizen123');
  console.log('  Company: company@kcrvp.in / company123');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
