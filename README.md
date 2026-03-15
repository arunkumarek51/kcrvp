# 🌿 KCRVP – Kerala Carbon Registry and Verification Platform

> **Climate-tech startup prototype** — Track, verify, and monetize green activities with AI verification, GPS tracking, and blockchain-backed carbon credits.

[![Made for Kerala](https://img.shields.io/badge/Made%20for-Kerala%20🌴-2d9b5a)](.)
[![Polygon](https://img.shields.io/badge/Blockchain-Polygon-8247e5)](.)
[![License](https://img.shields.io/badge/License-MIT-blue)](.)

---

## 📋 Table of Contents
- [Architecture Overview](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#structure)
- [API Reference](#api)
- [Smart Contract](#blockchain)
- [Demo Credentials](#demo)
- [Carbon Calculation Logic](#carbon)
- [Deployment Guide](#deployment)

---

## 🏗 Architecture Overview <a name="architecture"></a>

```
┌─────────────────────────────────────────────────┐
│                   Clients                       │
│   Flutter Mobile App    React Web Dashboard     │
└────────────────┬────────────────┬───────────────┘
                 │                │
                 ▼                ▼
┌─────────────────────────────────────────────────┐
│           Node.js + Express Backend             │
│  ┌──────────────────────────────────────────┐   │
│  │  Auth  │  Activities  │  Marketplace     │   │
│  │  Audit │  Credits     │  Stats │ Blockchain│ │
│  └──────────────────────────────────────────┘   │
│           Socket.IO (Real-time)                 │
└────────┬──────────────┬──────────────┬──────────┘
         │              │              │
         ▼              ▼              ▼
    MongoDB Atlas   Cloudinary    Polygon Chain
    (Data Store)  (Image Store)  (Carbon NFTs)
         │
         ▼
   AI Vision API (Google Cloud Vision)
   Google Maps API (GPS verification)
```

---

## ✨ Features <a name="features"></a>

| Feature | Status | Description |
|---------|--------|-------------|
| 🔐 Authentication | ✅ | JWT-based with 5 user roles |
| 🌱 Activity Upload | ✅ | 4 activity types, photo upload, GPS capture |
| 🤖 AI Verification | ✅ | Google Vision API + mock fallback |
| 📍 GPS Verification | ✅ | Location capture + duplicate detection |
| 🧮 Carbon Calculator | ✅ | Automated CO₂ calculation |
| 🪙 Carbon Credits | ✅ | Auto-issued on approval (1000 kg = 1 credit) |
| ⛓️ Blockchain Registry | ✅ | Polygon NFT for each verified credit |
| 🔍 Auditor Panel | ✅ | Approve/reject with notes |
| 🛒 Marketplace | ✅ | Buy/sell credits with simulated payment |
| 📊 Dashboard | ✅ | Charts, stats, leaderboard |
| 🗺️ Map View | ✅ | Kerala activity map with GPS markers |
| 👑 Admin Panel | ✅ | User management, fraud detection |
| 📱 Flutter Mobile | ✅ | iOS + Android app |
| 🔔 Real-time | ✅ | Socket.IO notifications |

---

## 🚀 Quick Start <a name="quick-start"></a>

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone & setup

```bash
git clone <repo-url>
cd kcrvp
```

### 2. Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI (minimum required)
# MONGODB_URI=mongodb://localhost:27017/kcrvp

# Seed demo data
npm run seed

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

### 3. Web Dashboard

```bash
cd web-dashboard

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
# Dashboard opens at http://localhost:3000
```

### 4. Flutter Mobile App

```bash
cd flutter-mobile

# Install Flutter dependencies
flutter pub get

# For Android emulator (default BASE_URL is http://10.0.2.2:5000/api)
flutter run

# For iOS simulator, change BASE_URL in lib/services/api_service.dart to:
# http://localhost:5000/api
```

---

## 📁 Project Structure <a name="structure"></a>

```
kcrvp/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express + Socket.IO entry
│   │   ├── models/
│   │   │   ├── User.js            # User schema with roles
│   │   │   ├── Activity.js        # Green activity with AI fields
│   │   │   └── Credit.js          # CarbonCredit, Listing, Transaction
│   │   ├── routes/
│   │   │   ├── auth.js            # Register, login, JWT
│   │   │   ├── activities.js      # Submit, list, GPS check
│   │   │   ├── auditor.js         # Review & approve activities
│   │   │   ├── marketplace.js     # Buy/sell carbon credits
│   │   │   ├── admin.js           # User management
│   │   │   ├── stats.js           # Analytics & leaderboard
│   │   │   ├── credits.js         # Credit wallet
│   │   │   └── blockchain.js      # On-chain recording
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT protect + role authorize
│   │   ├── services/
│   │   │   └── aiVerification.js  # Google Vision + mock fallback
│   │   └── utils/
│   │       └── seedData.js        # Full demo dataset
│   ├── .env.example
│   └── package.json
│
├── web-dashboard/
│   ├── src/
│   │   ├── App.js                 # Router + lazy loading
│   │   ├── context/
│   │   │   └── AuthContext.js     # Global auth + API instance
│   │   ├── components/
│   │   │   ├── Layout.js          # Sidebar + topbar
│   │   │   └── LoadingScreen.js   # Splash loader
│   │   └── pages/
│   │       ├── Login.js           # Login with demo buttons
│   │       ├── Register.js        # Role-based registration
│   │       ├── Dashboard.js       # Stats + charts + recent
│   │       ├── SubmitActivity.js  # 4-step wizard + GPS + upload
│   │       ├── Activities.js      # Activity list + filters
│   │       ├── ActivityDetail.js  # Full detail + blockchain
│   │       ├── Marketplace.js     # Buy/sell credit listings
│   │       ├── Credits.js         # Wallet + transactions
│   │       ├── AuditorPanel.js    # Review queue
│   │       ├── AdminPanel.js      # User/fraud management
│   │       ├── Leaderboard.js     # District + user rankings
│   │       ├── MapView.js         # Kerala activity map
│   │       └── Profile.js         # User profile + stats
│   └── package.json
│
├── smart-contract/
│   ├── contracts/
│   │   └── KCRVPCarbonRegistry.sol  # ERC-721 carbon credit NFT
│   ├── scripts/
│   │   └── deploy.js               # Hardhat deployment
│   ├── hardhat.config.js
│   └── package.json
│
└── flutter-mobile/
    ├── lib/
    │   ├── main.dart                # App entry + routing
    │   ├── services/
    │   │   ├── api_service.dart     # Dio HTTP client
    │   │   └── auth_service.dart    # Auth state management
    │   └── screens/
    │       └── auth/
    │           └── login_screen.dart
    └── pubspec.yaml
```

---

## 🌿 Carbon Calculation Logic <a name="carbon"></a>

| Activity | Rate | Formula |
|----------|------|---------|
| 🌳 Tree Planting | 22 kg CO₂/tree/year | `quantity × 22` |
| ☀️ Solar Energy | 0.85 kg CO₂/kWh | `quantity × 0.85` |
| 🚗 EV Driving | 0.12 kg CO₂/km | `quantity × 0.12` |
| 🌾 Organic Farming | 200 kg CO₂/acre/year | `quantity × 200` |

**Credit Conversion:** `1,000 kg CO₂ = 1 Carbon Credit`

---

## 🔗 API Reference <a name="api"></a>

### Authentication
```
POST /api/auth/register    Create account
POST /api/auth/login       Login, returns JWT
GET  /api/auth/me          Current user (auth required)
PUT  /api/auth/update-profile  Update profile
```

### Activities
```
GET  /api/activities            All activities (filtered)
GET  /api/activities/my         Current user's activities
GET  /api/activities/map        GPS-pinned activities for map
POST /api/activities            Submit new activity (multipart)
GET  /api/activities/:id        Activity detail
```

### Auditor
```
GET  /api/auditor/pending       Pending review queue
PUT  /api/auditor/verify/:id    Approve or reject
GET  /api/auditor/stats         Review statistics
```

### Marketplace
```
GET  /api/marketplace/listings  Active listings
POST /api/marketplace/list      List credits for sale
POST /api/marketplace/buy/:id   Buy credits
DEL  /api/marketplace/cancel/:id Cancel listing
```

### Stats
```
GET  /api/stats/platform        Platform-wide analytics
GET  /api/stats/user/:id        User analytics
GET  /api/stats/leaderboard     Top 20 users by CO₂
```

### Blockchain
```
POST /api/blockchain/record/:creditId  Record credit on Polygon
GET  /api/blockchain/verify/:txHash    Verify blockchain record
```

---

## ⛓️ Smart Contract <a name="blockchain"></a>

**Contract:** `KCRVPCarbonRegistry.sol` — ERC-721 NFT on Polygon

**Key functions:**
```solidity
issueCredit(address recipient, uint256 co2Grams, ActivityType type, ...)
retireCredit(uint256 tokenId, string reason)
getCredit(uint256 tokenId)
getPlatformStats()
```

**Deploy to Mumbai Testnet:**
```bash
cd smart-contract
npm install
cp .env.example .env   # Add DEPLOYER_PRIVATE_KEY
npx hardhat run scripts/deploy.js --network mumbai
```

---

## 🎭 Demo Credentials <a name="demo"></a>

After running `npm run seed` in the backend:

| Role    | Email               | Password   | Capabilities |
|---------|---------------------|------------|--------------|
| Admin   | admin@kcrvp.in      | admin123   | Full platform access |
| Auditor | auditor@kcrvp.in    | auditor123 | Verify activities |
| Farmer  | farmer@kcrvp.in     | farmer123  | Submit + sell credits |
| Citizen | citizen@kcrvp.in    | citizen123 | Submit activities |
| Company | company@kcrvp.in    | company123 | Buy carbon credits (₹10,000 balance) |

---

## 🌐 Deployment Guide <a name="deployment"></a>

### Backend (Railway / Render / AWS)
```bash
# Set environment variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-secret>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CONTRACT_ADDRESS=<deployed-contract>
BLOCKCHAIN_PRIVATE_KEY=<platform-wallet-key>
```

### Web Dashboard (Vercel / Netlify)
```bash
npm run build
# Set REACT_APP_API_URL=https://your-backend.railway.app/api
```

### Smart Contract (Polygon Mumbai)
```bash
cd smart-contract
npx hardhat run scripts/deploy.js --network mumbai
# Verify: npx hardhat verify --network mumbai <ADDRESS> <OWNER>
```

---

## 🔐 Security Notes

- JWT tokens expire in 7 days (configurable)
- Rate limiting: 200 requests / 15 minutes per IP
- Helmet.js for HTTP security headers
- Duplicate GPS detection radius: 50 meters
- Auditor approval required before access
- Admin-only user activation/deactivation

---

## 📱 Mobile App Notes

- **Android emulator:** API URL is `http://10.0.2.2:5000/api`
- **iOS simulator:** API URL is `http://localhost:5000/api`
- **Physical device:** Replace with your local machine IP: `http://192.168.x.x:5000/api`
- Camera permissions required for activity photo upload
- Location permissions required for GPS capture

---

## 🌱 Built for Kerala

> KCRVP was designed to support Kerala's green transition goals — tracking local climate action, empowering farmers and citizens, and creating verifiable carbon markets that connect grassroots environmental action to global climate finance.

*Built as a startup demo / climate-tech competition prototype.*

---

## 📄 License

MIT License — Free to use, modify, and distribute.
