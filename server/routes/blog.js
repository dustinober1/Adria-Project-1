const express = require('express');
const BlogArticle = require('../models/BlogArticle');

const router = express.Router();

// Get all published articles (public)
router.get('/', async (req, res) => {
  try {
    const articles = await BlogArticle.findPublished();
    res.json({
      success: true,
      articles
    });
  } catch (error) {
    console.error('Get published articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve articles'
    });
  }
});

// Get single published article by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const article = await BlogArticle.findBySlug(slug);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    if (!article.published) {
      return res.status(404).json({
        success: false,
        message: 'Article not published'
      });
    }

    res.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve article'
    });
  }
});

module.exports = router;
