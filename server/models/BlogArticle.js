const { query } = require('../database/db');

class BlogArticle {
  // Create a new blog article
  static async create({ title, slug, content, excerpt, authorId, featured_image }) {
    try {
      const result = await query(
        `INSERT INTO blog_articles (title, slug, content, excerpt, author_id, featured_image, published, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING id, title, slug, excerpt, author_id, featured_image, published, created_at, updated_at`,
        [title, slug, content, excerpt, authorId, featured_image]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Article slug already exists');
      }
      throw error;
    }
  }

  // Get article by ID
  static async findById(id) {
    const result = await query(
      `SELECT ba.*, u.first_name, u.last_name, u.email 
       FROM blog_articles ba 
       LEFT JOIN users u ON ba.author_id = u.id 
       WHERE ba.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  // Get article by slug
  static async findBySlug(slug) {
    const result = await query(
      `SELECT ba.*, u.first_name, u.last_name, u.email 
       FROM blog_articles ba 
       LEFT JOIN users u ON ba.author_id = u.id 
       WHERE ba.slug = $1`,
      [slug]
    );
    return result.rows[0];
  }

  // Get all articles (admin view - all statuses)
  static async findAll() {
    const result = await query(
      `SELECT ba.*, u.first_name, u.last_name, u.email 
       FROM blog_articles ba 
       LEFT JOIN users u ON ba.author_id = u.id 
       ORDER BY ba.created_at DESC`
    );
    return result.rows;
  }

  // Get published articles (public view)
  static async findPublished() {
    const result = await query(
      `SELECT ba.*, u.first_name, u.last_name, u.email 
       FROM blog_articles ba 
       LEFT JOIN users u ON ba.author_id = u.id 
       WHERE ba.published = true 
       ORDER BY ba.created_at DESC`
    );
    return result.rows;
  }

  // Update article
  static async update(id, { title, slug, content, excerpt, featured_image, published }) {
    try {
      const result = await query(
        `UPDATE blog_articles 
         SET title = COALESCE($1, title), 
             slug = COALESCE($2, slug), 
             content = COALESCE($3, content), 
             excerpt = COALESCE($4, excerpt), 
             featured_image = COALESCE($5, featured_image),
             published = COALESCE($6, published),
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $7 
         RETURNING *`,
        [title, slug, content, excerpt, featured_image, published, id]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Article slug already exists');
      }
      throw error;
    }
  }

  // Delete article
  static async delete(id) {
    await query('DELETE FROM blog_articles WHERE id = $1', [id]);
  }

  // Get articles by author
  static async findByAuthorId(authorId) {
    const result = await query(
      `SELECT * FROM blog_articles WHERE author_id = $1 ORDER BY created_at DESC`,
      [authorId]
    );
    return result.rows;
  }
}

module.exports = BlogArticle;
