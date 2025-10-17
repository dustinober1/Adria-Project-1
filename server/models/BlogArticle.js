const { query } = require('../database/db');
const logger = require('../utils/logger');
const User = require('./User');

class BlogArticle {
  // Create a new blog article
  static async create({ title, slug, content, excerpt, authorId, featured_image }) {
    try {
      // Check if slug already exists
      const existingResult = await query('SELECT id FROM blog_articles WHERE slug = $1', [slug]);
      if (existingResult.rows.length > 0) {
        throw new Error('Article slug already exists');
      }

      const result = await query(
        `INSERT INTO blog_articles (title, slug, content, excerpt, author_id, featured_image, published)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)
         RETURNING id, title, slug, excerpt, author_id, featured_image, published, created_at, updated_at`,
        [title, slug, content, excerpt, authorId || null, featured_image || '']
      );

      const article = result.rows[0];
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        author_id: article.author_id,
        featured_image: article.featured_image,
        published: article.published,
        created_at: article.created_at,
        updated_at: article.updated_at
      };
    } catch (error) {
      logger.error('Error creating blog article:', error);
      throw error;
    }
  }

  // Get article by ID
  static async findById(id) {
    try {
      const result = await query('SELECT * FROM blog_articles WHERE id = $1', [id]);
      if (result.rows.length > 0) {
        const article = result.rows[0];
        const author = article.author_id ? await User.findById(article.author_id) : null;
        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          author_id: article.author_id,
          featured_image: article.featured_image,
          published: article.published,
          created_at: article.created_at,
          updated_at: article.updated_at,
          first_name: author?.first_name || '',
          last_name: author?.last_name || '',
          email: author?.email || ''
        };
      }
      return null;
    } catch (error) {
      logger.error('Error finding article by ID:', error);
      throw error;
    }
  }

  // Get article by slug
  static async findBySlug(slug) {
    try {
      const result = await query('SELECT * FROM blog_articles WHERE slug = $1', [slug]);
      if (result.rows.length > 0) {
        const article = result.rows[0];
        const author = article.author_id ? await User.findById(article.author_id) : null;
        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          author_id: article.author_id,
          featured_image: article.featured_image,
          published: article.published,
          created_at: article.created_at,
          updated_at: article.updated_at,
          first_name: author?.first_name || '',
          last_name: author?.last_name || '',
          email: author?.email || ''
        };
      }
      return null;
    } catch (error) {
      logger.error('Error finding article by slug:', error);
      throw error;
    }
  }

  // Get all articles (admin view - all statuses)
  static async findAll() {
    try {
      const result = await query('SELECT * FROM blog_articles ORDER BY created_at DESC');
      const enrichedArticles = [];
      
      for (const article of result.rows) {
        const author = article.author_id ? await User.findById(article.author_id) : null;
        enrichedArticles.push({
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          author_id: article.author_id,
          featured_image: article.featured_image,
          published: article.published,
          created_at: article.created_at,
          updated_at: article.updated_at,
          first_name: author?.first_name || '',
          last_name: author?.last_name || '',
          email: author?.email || ''
        });
      }
      
      return enrichedArticles;
    } catch (error) {
      logger.error('Error finding all articles:', error);
      throw error;
    }
  }

  // Get published articles (public view)
  static async findPublished() {
    try {
      const result = await query('SELECT * FROM blog_articles WHERE published = TRUE ORDER BY created_at DESC');
      const enrichedArticles = [];
      
      for (const article of result.rows) {
        const author = article.author_id ? await User.findById(article.author_id) : null;
        enrichedArticles.push({
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          author_id: article.author_id,
          featured_image: article.featured_image,
          published: true,
          created_at: article.created_at,
          updated_at: article.updated_at,
          first_name: author?.first_name || '',
          last_name: author?.last_name || '',
          email: author?.email || ''
        });
      }
      
      return enrichedArticles;
    } catch (error) {
      logger.error('Error finding published articles:', error);
      throw error;
    }
  }

  // Update article
  static async update(id, { title, slug, content, excerpt, featured_image, published }) {
    try {
      // Check if article exists
      const existingResult = await query('SELECT id, slug FROM blog_articles WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        throw new Error('Article not found');
      }
      const existingArticle = existingResult.rows[0];

      // Check if new slug conflicts with another article
      if (slug && slug !== existingArticle.slug) {
        const conflictResult = await query('SELECT id FROM blog_articles WHERE slug = $1 AND id != $2', [slug, id]);
        if (conflictResult.rows.length > 0) {
          throw new Error('Article slug already exists');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;
      
      if (title !== undefined) {
        updateFields.push(`title = $${paramCount}`);
        updateValues.push(title);
        paramCount++;
      }
      if (slug !== undefined) {
        updateFields.push(`slug = $${paramCount}`);
        updateValues.push(slug);
        paramCount++;
      }
      if (content !== undefined) {
        updateFields.push(`content = $${paramCount}`);
        updateValues.push(content);
        paramCount++;
      }
      if (excerpt !== undefined) {
        updateFields.push(`excerpt = $${paramCount}`);
        updateValues.push(excerpt);
        paramCount++;
      }
      if (featured_image !== undefined) {
        updateFields.push(`featured_image = $${paramCount}`);
        updateValues.push(featured_image);
        paramCount++;
      }
      if (published !== undefined) {
        updateFields.push(`published = $${paramCount}`);
        updateValues.push(published);
        paramCount++;
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      await query(
        `UPDATE blog_articles SET ${updateFields.join(', ')} WHERE id = $${paramCount}`,
        updateValues
      );

      // Return updated article
      return await this.findById(id);
    } catch (error) {
      logger.error('Error updating article:', error);
      throw error;
    }
  }

  // Delete article
  static async delete(id) {
    try {
      await query('DELETE FROM blog_articles WHERE id = $1', [id]);
    } catch (error) {
      logger.error('Error deleting article:', error);
      throw error;
    }
  }

  // Get articles by author
  static async findByAuthorId(authorId) {
    try {
      const result = await query('SELECT * FROM blog_articles WHERE author_id = $1 ORDER BY created_at DESC', [authorId]);
      return result.rows.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        author_id: article.author_id,
        featured_image: article.featured_image,
        published: article.published,
        created_at: article.created_at,
        updated_at: article.updated_at
      }));
    } catch (error) {
      logger.error('Error finding articles by author:', error);
      throw error;
    }
  }
}

module.exports = BlogArticle;
