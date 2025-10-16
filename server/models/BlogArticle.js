const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const csvStringify = require('csv-stringify/sync');
const { v4: uuidv4 } = require('uuid');
const User = require('./User');

const ARTICLES_CSV_PATH = path.join(__dirname, '..', '..', 'data', 'blog_articles.csv');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(ARTICLES_CSV_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get all articles from CSV
const getAllArticlesFromCSV = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(ARTICLES_CSV_PATH)) {
      return [];
    }
    const fileContent = fs.readFileSync(ARTICLES_CSV_PATH, 'utf-8');
    if (!fileContent.trim()) {
      return [];
    }
    return csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } catch (error) {
    console.error('Error reading articles CSV:', error);
    return [];
  }
};

// Write articles to CSV
const writeArticlesToCSV = (articles) => {
  try {
    ensureDataDir();
    const output = csvStringify.stringify(articles, {
      header: true,
      columns: ['id', 'title', 'slug', 'content', 'excerpt', 'author_id', 'featured_image', 'published', 'created_at', 'updated_at']
    });
    fs.writeFileSync(ARTICLES_CSV_PATH, output, 'utf-8');
  } catch (error) {
    console.error('Error writing articles CSV:', error);
    throw error;
  }
};

class BlogArticle {
  // Create a new blog article
  static async create({ title, slug, content, excerpt, authorId, featured_image }) {
    try {
      // Check if slug already exists
      const articles = getAllArticlesFromCSV();
      if (articles.some(a => a.slug === slug)) {
        throw new Error('Article slug already exists');
      }

      const newArticle = {
        id: uuidv4(),
        title,
        slug,
        content,
        excerpt,
        author_id: authorId || '',
        featured_image: featured_image || '',
        published: 'false',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      articles.push(newArticle);
      writeArticlesToCSV(articles);

      return {
        id: newArticle.id,
        title: newArticle.title,
        slug: newArticle.slug,
        excerpt: newArticle.excerpt,
        author_id: newArticle.author_id,
        featured_image: newArticle.featured_image,
        published: newArticle.published === 'true',
        created_at: newArticle.created_at,
        updated_at: newArticle.updated_at
      };
    } catch (error) {
      throw error;
    }
  }

  // Get article by ID
  static async findById(id) {
    const articles = getAllArticlesFromCSV();
    const article = articles.find(a => a.id === id);
    if (article) {
      const author = article.author_id ? await User.findById(article.author_id) : null;
      return {
        ...article,
        published: article.published === 'true',
        first_name: author?.first_name || '',
        last_name: author?.last_name || '',
        email: author?.email || ''
      };
    }
    return null;
  }

  // Get article by slug
  static async findBySlug(slug) {
    const articles = getAllArticlesFromCSV();
    const article = articles.find(a => a.slug === slug);
    if (article) {
      const author = article.author_id ? await User.findById(article.author_id) : null;
      return {
        ...article,
        published: article.published === 'true',
        first_name: author?.first_name || '',
        last_name: author?.last_name || '',
        email: author?.email || ''
      };
    }
    return null;
  }

  // Get all articles (admin view - all statuses)
  static async findAll() {
    const articles = getAllArticlesFromCSV();
    const enrichedArticles = [];
    
    for (const article of articles) {
      const author = article.author_id ? await User.findById(article.author_id) : null;
      enrichedArticles.push({
        ...article,
        published: article.published === 'true',
        first_name: author?.first_name || '',
        last_name: author?.last_name || '',
        email: author?.email || ''
      });
    }
    
    return enrichedArticles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Get published articles (public view)
  static async findPublished() {
    const articles = getAllArticlesFromCSV();
    const published = articles.filter(a => a.published === 'true');
    const enrichedArticles = [];
    
    for (const article of published) {
      const author = article.author_id ? await User.findById(article.author_id) : null;
      enrichedArticles.push({
        ...article,
        published: true,
        first_name: author?.first_name || '',
        last_name: author?.last_name || '',
        email: author?.email || ''
      });
    }
    
    return enrichedArticles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Update article
  static async update(id, { title, slug, content, excerpt, featured_image, published }) {
    try {
      const articles = getAllArticlesFromCSV();
      const articleIndex = articles.findIndex(a => a.id === id);
      
      if (articleIndex === -1) {
        throw new Error('Article not found');
      }

      // Check if new slug conflicts with another article
      if (slug && slug !== articles[articleIndex].slug) {
        if (articles.some(a => a.slug === slug && a.id !== id)) {
          throw new Error('Article slug already exists');
        }
      }

      const article = articles[articleIndex];
      if (title !== undefined) article.title = title;
      if (slug !== undefined) article.slug = slug;
      if (content !== undefined) article.content = content;
      if (excerpt !== undefined) article.excerpt = excerpt;
      if (featured_image !== undefined) article.featured_image = featured_image;
      if (published !== undefined) article.published = published ? 'true' : 'false';
      article.updated_at = new Date().toISOString();

      writeArticlesToCSV(articles);

      return {
        ...article,
        published: article.published === 'true'
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete article
  static async delete(id) {
    const articles = getAllArticlesFromCSV();
    const filtered = articles.filter(a => a.id !== id);
    writeArticlesToCSV(filtered);
  }

  // Get articles by author
  static async findByAuthorId(authorId) {
    const articles = getAllArticlesFromCSV();
    return articles
      .filter(a => a.author_id === authorId)
      .map(a => ({
        ...a,
        published: a.published === 'true'
      }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

module.exports = BlogArticle;
