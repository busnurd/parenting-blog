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

// API Routes - Dynamic Blog Data
app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, slug, excerpt, category, author, created_at FROM posts ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to fetch posts from database' });
  }
});

app.get('/api/posts/:slug', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM posts WHERE slug = ?', [req.params.slug]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// API Endpoint: Fetch Theme Colors
app.get('/api/settings/colors', async (req, res) => {
  try {
    const [results] = await db.query('SELECT setting_key, setting_value FROM settings');
    const colors = {};
    results.forEach(row => {
      colors[row.setting_key] = row.setting_value;
    });
    res.json(colors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Server Listener for Local Dev
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
