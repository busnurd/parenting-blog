const express = require('express');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware & Static Files (Serves everything inside 'views' and root)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/css', express.static(path.join(__dirname, 'views', 'css')));
app.use('/js', express.static(path.join(__dirname, 'views', 'js')));

// Railway MySQL Connection
const db = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_DATABASE || 'railway',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Auto-Create Database Tables & Seed Sample Post
const initDB = () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      author_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  const createSettingsTable = `
    CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(50) UNIQUE NOT NULL,
      setting_value TEXT
    );`;

  db.query(createUsersTable);
  db.query(createSettingsTable);

  db.query(createPostsTable, (err) => {
    if (err) {
      console.error('Error creating posts table:', err);
    } else {
      console.log('✅ Posts table ready.');
      // Seed a test post if empty so articles page displays content
      db.query('SELECT COUNT(*) AS count FROM posts', (err, results) => {
        if (!err && results[0].count === 0) {
          const samplePost = `INSERT INTO posts (title, content) VALUES ('Welcome to Parenting Blog', 'This is your first official post on the new Railway database!')`;
          db.query(samplePost, () => console.log('✅ Seeded sample blog post.'));
        }
      });
    }
  });
};

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to Railway MySQL!');
    connection.release();
    initDB();
  }
});

// Page Routes (Serving HTML files from 'views')
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));
app.get('/resources', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resources.html')));
app.get('/subscribe', (req, res) => res.sendFile(path.join(__dirname, 'views', 'subscribe.html')));

// Catch-all route for "View Articles" links (e.g., /articles, /blog, or /posts)
app.get(['/articles', '/blog', '/posts'], (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'articles.html'), (err) => {
    if (err) res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });
});

// API Endpoint for Fetching Posts
app.get('/api/posts', (req, res) => {
  db.query('SELECT * FROM posts ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database query failed' });
    res.json(results);
  });
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'), (err) => {
    if (err) res.status(404).send('<h1>404 - Page Not Found</h1>');
  });
});

app.listen(PORT, () => console.log(`🚀 Server listening on port ${PORT}`));
