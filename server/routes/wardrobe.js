const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');
const User = require('../models/User');

const router = express.Router();
const WARDROBE_DIR = path.join(__dirname, '..', '..', 'data', 'wardrobes');

// Ensure wardrobes directory exists
const ensureWardrobeDir = (userId) => {
  const userDir = path.join(WARDROBE_DIR, userId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
};

// Get user's saved wardrobe
router.get('/wardrobe', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Free tier users don't have saved wardrobes
    if (user.customer_tier === 'free') {
      return res.json({
        success: true,
        message: 'Free tier users cannot save wardrobes',
        tops: [],
        bottoms: [],
        tier: 'free'
      });
    }

    const userDir = path.join(WARDROBE_DIR, userId);
    const wardrobe = { tops: [], bottoms: [] };

    if (fs.existsSync(userDir)) {
      const topsDir = path.join(userDir, 'tops');
      const bottomsDir = path.join(userDir, 'bottoms');

      if (fs.existsSync(topsDir)) {
        wardrobe.tops = fs.readdirSync(topsDir).map(file => ({
          id: file,
          url: `/api/wardrobe/image/${userId}/tops/${file}`,
          name: file.replace(/\.[^/.]+$/, '')
        }));
      }

      if (fs.existsSync(bottomsDir)) {
        wardrobe.bottoms = fs.readdirSync(bottomsDir).map(file => ({
          id: file,
          url: `/api/wardrobe/image/${userId}/bottoms/${file}`,
          name: file.replace(/\.[^/.]+$/, '')
        }));
      }
    }

    res.json({
      success: true,
      ...wardrobe,
      tier: user.customer_tier
    });
  } catch (error) {
    logger.error('Get wardrobe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wardrobe'
    });
  }
});

// Save wardrobe items (base64 images)
router.post('/wardrobe/save', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, type } = req.body; // type: 'tops' or 'bottoms', items: array of {name, data: base64}

    if (!items || !type || !['tops', 'bottoms'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request'
      });
    }

    const user = await User.findById(userId);

    // Free tier users cannot save wardrobes
    if (user.customer_tier === 'free') {
      return res.status(403).json({
        success: false,
        message: 'Upgrade to paid tier to save your wardrobe'
      });
    }

    const userDir = ensureWardrobeDir(userId);
    const typeDir = path.join(userDir, type);
    
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }

    const savedItems = [];

    for (const item of items) {
      if (!item.name || !item.data) continue;

      // Create unique filename
      const timestamp = Date.now();
      const filename = `${item.name.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.jpg`;
      const filepath = path.join(typeDir, filename);

      // Convert base64 to buffer and save
      const base64Data = item.data.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filepath, buffer);

      savedItems.push({
        name: item.name,
        filename: filename
      });
    }

    res.json({
      success: true,
      message: `Saved ${savedItems.length} items to your wardrobe`,
      saved: savedItems
    });
  } catch (error) {
    logger.error('Save wardrobe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save wardrobe'
    });
  }
});

// Get individual wardrobe image
router.get('/image/:userId/:type/:filename', (req, res) => {
  try {
    const { userId, type, filename } = req.params;

    if (!['tops', 'bottoms'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const filepath = path.join(WARDROBE_DIR, userId, type, filename);

    // Security: prevent directory traversal
    if (!filepath.startsWith(WARDROBE_DIR)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.type('image/jpeg');
    res.sendFile(filepath);
  } catch (error) {
    logger.error('Get wardrobe image error:', error);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

// Delete wardrobe item
router.delete('/wardrobe/:type/:filename', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, filename } = req.params;

    if (!['tops', 'bottoms'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type'
      });
    }

    const filepath = path.join(WARDROBE_DIR, userId, type, filename);

    // Security: prevent directory traversal
    if (!filepath.startsWith(WARDROBE_DIR)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    res.json({
      success: true,
      message: 'Item deleted'
    });
  } catch (error) {
    logger.error('Delete wardrobe item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete item'
    });
  }
});

// Clear entire wardrobe
router.delete('/wardrobe/:type', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.params;

    if (!['tops', 'bottoms'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type'
      });
    }

    const typeDir = path.join(WARDROBE_DIR, userId, type);

    if (fs.existsSync(typeDir)) {
      fs.rmSync(typeDir, { recursive: true });
    }

    res.json({
      success: true,
      message: `${type} cleared`
    });
  } catch (error) {
    logger.error('Clear wardrobe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wardrobe'
    });
  }
});

module.exports = router;
