/**
 * AI Verification Service
 * Uses Google Vision API or falls back to mock analysis
 */
const axios = require('axios');

const ACTIVITY_KEYWORDS = {
  tree_planting: ['tree', 'plant', 'forest', 'sapling', 'vegetation', 'leaf', 'nature', 'green', 'soil', 'garden'],
  solar_energy: ['solar', 'panel', 'photovoltaic', 'electricity', 'roof', 'array', 'module', 'installation'],
  ev_driving: ['car', 'vehicle', 'automobile', 'electric', 'charging', 'station', 'tesla', 'transport'],
  organic_farming: ['farm', 'field', 'crop', 'agriculture', 'harvest', 'paddy', 'rice', 'cultivation', 'land', 'soil']
};

/**
 * Mock AI analysis that simulates vision API
 */
function mockAnalyzeImage(activityType, imageUrl) {
  const keywords = ACTIVITY_KEYWORDS[activityType] || [];
  const detected = keywords.slice(0, Math.floor(Math.random() * 4) + 2);
  const confidence = 60 + Math.floor(Math.random() * 35); // 60-95

  return {
    analyzed: true,
    confidence,
    detectedObjects: detected,
    verificationStatus: confidence > 70 ? 'passed' : 'failed',
    analysisDetails: `Mock AI detected: ${detected.join(', ')}. Confidence: ${confidence}%`
  };
}

/**
 * Real Google Vision API analysis
 */
async function analyzeWithVisionAPI(imageUrl, activityType) {
  if (!process.env.AI_VISION_API_KEY) return null;

  try {
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.AI_VISION_API_KEY}`,
      {
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 10 }
          ]
        }]
      }
    );

    const labels = response.data.responses[0]?.labelAnnotations || [];
    const objects = response.data.responses[0]?.localizedObjectAnnotations || [];
    const allDetected = [
      ...labels.map(l => l.description.toLowerCase()),
      ...objects.map(o => o.name.toLowerCase())
    ];

    const keywords = ACTIVITY_KEYWORDS[activityType] || [];
    const matchedKeywords = keywords.filter(kw => allDetected.some(d => d.includes(kw)));
    const maxScore = labels[0]?.score || 0;
    const confidence = Math.min(95, Math.floor(maxScore * 100 * (matchedKeywords.length > 0 ? 1.2 : 0.5)));

    return {
      analyzed: true,
      confidence,
      detectedObjects: allDetected.slice(0, 10),
      verificationStatus: confidence > 65 && matchedKeywords.length > 0 ? 'passed' : 'failed',
      analysisDetails: `Detected ${allDetected.length} objects. Match score: ${confidence}%`
    };
  } catch (err) {
    console.error('Vision API error:', err.message);
    return null;
  }
}

/**
 * Main verification function
 */
async function verifyActivityImage(imageUrl, activityType) {
  // Try real API first
  const realResult = await analyzeWithVisionAPI(imageUrl, activityType);
  if (realResult) return realResult;

  // Fall back to mock
  return mockAnalyzeImage(activityType, imageUrl);
}

/**
 * Check for duplicate GPS submissions
 */
async function checkDuplicateLocation(Activity, coordinates, userId, radius = 100) {
  if (!coordinates || coordinates.length < 2) return [];

  const nearby = await Activity.find({
    user: { $ne: userId },
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: radius
      }
    },
    verificationStatus: { $in: ['approved', 'auditor_verified'] },
    submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).limit(5);

  return nearby;
}

module.exports = { verifyActivityImage, checkDuplicateLocation };
