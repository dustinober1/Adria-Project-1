const { query, run, get } = require('../database/sqlite');
const logger = require('../utils/logger');
const User = require('./User');

class BlogArticle {
  // Create a new blog article
  static async create({ title, slug, content, excerpt, authorId, featured_image }) {
    try {
      // Check if slug already exists
      const existingArticle = await get('SELECT id FROM blog_articles WHERE slug = ?', [slug]);
      if (existingArticle) {
        throw new Error('Article slug already exists');
      }

      const result = await run(
        `INSERT INTO blog_articles (title, slug, content, excerpt, author_id, featured_image, published)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [title, slug, content, excerpt, authorId || null, featured_image || '']
      );

      return {
        id: result.lastID,
        title,
        slug,
        excerpt,
        author_id: authorId || null,
        featured_image: featured_image || '',
        published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error creating blog article:', error);
      throw error;
    }
  }

  // Get article by ID
  static async findById(id) {
    try {
      const article = await get('SELECT * FROM blog_articles WHERE id = ?', [id]);
      if (article) {
        const author = article.author_id ? await User.findById(article.author_id) : null;
        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          author_id: article.author_id,
          featured_image: article.featured_image,
          published: Boolean(article.published),
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
      const article = await get('SELECT * FROM blog_articles WHERE slug = ?', [slug]);
      if (article) {
        const author = article.author_id ? await User.findById(article.author_id) : null;
        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          content: article.content,
          excerpt: article.excerpt,
          author_id: article.author_id,
          featured_image: article.featured_image,
          published: Boolean(article.published),
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
          published: Boolean(article.published),
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
      const result = await query('SELECT * FROM blog_articles WHERE published = 1 ORDER BY created_at DESC');
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
      const existingArticle = await get('SELECT id, slug FROM blog_articles WHERE id = ?', [id]);
      if (!existingArticle) {
        throw new Error('Article not found');
      }

      // Check if new slug conflicts with another article
      if (slug && slug !== existingArticle.slug) {
        const conflictingArticle = await get('SELECT id FROM blog_articles WHERE slug = ? AND id != ?', [slug, id]);
        if (conflictingArticle) {
          throw new Error('Article slug already exists');
        }
      }

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];
      
      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      if (slug !== undefined) {
        updateFields.push('slug = ?');
        updateValues.push(slug);
      }
      if (content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(content);
      }
      if (excerpt !== undefined) {
        updateFields.push('excerpt = ?');
        updateValues.push(excerpt);
      }
      if (featured_image !== undefined) {
        updateFields.push('featured_image = ?');
        updateValues.push(featured_image);
      }
      if (published !== undefined) {
        updateFields.push('published = ?');
        updateValues.push(published ? 1 : 0);
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      await run(
        `UPDATE blog_articles SET ${updateFields.join(', ')} WHERE id = ?`,
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
      await run('DELETE FROM blog_articles WHERE id = ?', [id]);
    } catch (error) {
      logger.error('Error deleting article:', error);
      throw error;
    }
  }

  // Get articles by author
  static async findByAuthorId(authorId) {
    try {
      const result = await query('SELECT * FROM blog_articles WHERE author_id = ? ORDER BY created_at DESC', [authorId]);
      return result.rows.map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        author_id: article.author_id,
        featured_image: article.featured_image,
        published: Boolean(article.published),
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
