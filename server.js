require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML Views
const sendView = (file) => (req, res) => {
  res.sendFile(path.join(__dirname, 'views', file));
};

app.get('/', sendView('index.html'));
app.get('/blog', sendView('blog.html'));
app.get('/about', sendView('about.html'));
app.get('/resources', sendView('resources.html'));
app.get('/subscribe', sendView('subscribe.html'));
app.get('/admin', sendView('admin.html'));
app.get('/post', sendView('post.html'));

// Database Auto-Setup / Seed Route
app.get('/api/setup-db', async (req, res) => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        excerpt TEXT,
        content LONGTEXT,
        category VARCHAR(100) DEFAULT 'General',
        author VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('master_admin', 'editor', 'admin') DEFAULT 'editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value VARCHAR(255) NOT NULL
      )
    `);

    const samplePosts = [
      ['10 Tips for Positive Parenting', '10-tips-positive-parenting', 'Simple strategies to foster an encouraging home environment.', '<p>Positive parenting focuses on teaching good behavior rather than punishing bad behavior...</p>', 'Parenting', 'Admin'],
      ['Healthy Snack Ideas for Toddlers', 'healthy-snack-ideas-toddlers', 'Quick and easy nutritional bites your kids will love.', '<p>Nutrition is vital during early childhood growth...</p>', 'Nutrition', 'Admin']
    ];

    for (const post of samplePosts) {
      await db.query(
        `INSERT INTO posts (title, slug, excerpt, content, category, author) 
         VALUES (?, ?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE id=id`,
        post
      );
    }

    await db.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE id=id`,
      ['busnurd', 'busnurd@example.com', 'placeholder_hash_master', 'master_admin']
    );

    await db.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE id=id`,
      ['isaac607', 'isaacjonas62@gmail.com', 'placeholder_hash_test', 'editor']
    );

    res.json({ message: 'Database tables created and seeded successfully!' });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: error.message || 'Database setup failed' });
  }
});

// API Route: Fetch All Posts
app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, slug, excerpt, category, author, created_at FROM posts ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch posts from database' });
  }
});

// API Route: Fetch Single Post by Slug
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM posts WHERE slug = ?', [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch post' });
  }
});

// API Route: Fetch Theme Colors
app.get('/api/settings/colors', async (req, res) => {
  try {
    const [results] = await db.query('SELECT setting_key, setting_value FROM settings');
    const colors = {};
    results.forEach(row => {
      colors[row.setting_key] = row.setting_value;
    });
    res.json(colors);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch color settings' });
  }
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
