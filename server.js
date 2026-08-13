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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'blog.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/resources', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'resources.html'));
});

app.get('/subscribe', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'subscribe.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

app.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'post.html'));
});

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;  } else {
    console.log('Connected to MySQL Database successfully!');
    connection.release();
  }
});

// Serve HTML Static Views
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'views', 'blog.html')));
app.get('/resources', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resources.html')));
app.get('/subscribe', (req, res) => res.sendFile(path.join(__dirname, 'views', 'subscribe.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

// API Endpoint: Fetch Theme Colors
app.get('/api/settings/colors', (req, res) => {
  db.query('SELECT setting_key, setting_value FROM settings', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const colors = {};
    results.forEach(row => {
      colors[row.setting_key] = row.setting_value;
    });
    res.json(colors);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
