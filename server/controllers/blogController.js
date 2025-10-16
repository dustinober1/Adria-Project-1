const { validationResult } = require('express-validator');
const BlogArticle = require('../models/BlogArticle');
const Admin = require('../models/Admin');

// Create a new blog article
const createArticle = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { title, slug, content, excerpt, featured_image } = req.body;

    const article = await BlogArticle.create({
      title,
      slug,
      content,
      excerpt,
      authorId: req.user.id,
      featured_image
    });

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create article'
    });
  }
};

// Get all articles (admin view)
const getAllArticles = async (req, res) => {
  try {
    const articles = await BlogArticle.findAll();
    res.json({
      success: true,
      articles
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve articles'
    });
  }
};

// Get single article
const getArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await BlogArticle.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
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
};

// Update article
const updateArticle = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { title, slug, content, excerpt, featured_image, published } = req.body;

    const article = await BlogArticle.update(id, {
      title,
      slug,
      content,
      excerpt,
      featured_image,
      published
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.json({
      success: true,
      message: 'Article updated successfully',
      article
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update article'
    });
  }
};

// Delete article
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await BlogArticle.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    await BlogArticle.delete(id);

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete article'
    });
  }
};

// Publish/unpublish article
const togglePublishArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;

    const article = await BlogArticle.findById(id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    const updatedArticle = await BlogArticle.update(id, { published });

    res.json({
      success: true,
      message: `Article ${published ? 'published' : 'unpublished'} successfully`,
      article: updatedArticle
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update article publish status'
    });
  }
};

module.exports = {
  createArticle,
  getAllArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  togglePublishArticle
};
