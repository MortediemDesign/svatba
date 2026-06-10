const https = require('https');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const CLOUD_NAME = 'dfukp8thk';
  const GALLERY_TAG = 'wedding2026';
  const API_KEY = process.env.CLOUDINARY_API_KEY;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET;

  if (!API_KEY || !API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary credentials missing' });
  }

  return new Promise((resolve) => {
    const url = `https://${API_KEY}:${API_SECRET}@api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search?resource_type=image&tags=${GALLERY_TAG}&max_results=500`;

    https.get(url, (cloudinaryRes) => {
      let data = '';
      cloudinaryRes.on('data', (chunk) => (data += chunk));
      cloudinaryRes.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.status(200).json(parsed.resources || []);
        } catch (e) {
          res.status(500).json({ error: 'Failed to parse response' });
        }
        resolve();
      });
    }).on('error', () => {
      res.status(500).json({ error: 'Cloudinary request failed' });
      resolve();
    });
  });
};