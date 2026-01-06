const express = require('express');
const router = express.Router();
const { generateSignedUrl, extractKeyFromUrl } = require('../utils/r2Storage');

// Get signed URL for image access (public access for main-website)
router.get('/signed-url', async (req, res) => {
  try {
    const { imageUrl } = req.query;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Extract the key from the image URL
    const key = extractKeyFromUrl(imageUrl);

    if (!key) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image URL format'
      });
    }

    // Generate signed URL (expires in 1 hour)
    const result = await generateSignedUrl(key, 3600);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate signed URL',
        error: result.error
      });
    }

    res.json({
      success: true,
      signedUrl: result.signedUrl
    });

  } catch (error) {
    console.error('Error in signed URL generation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
