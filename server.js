const express = require('express');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Static Asset Routes (Serves CSS, JS, Images, and Public files)
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

// 3. Railway MySQL Connection Pool
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

// 4. Database Schema Setup & Seed Data
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
      // Auto-insert a starter post if empty
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

// 5. Page HTML Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
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

// Explicit Blog / Articles Route
app.get(['/blog', '/articles', '/posts'], (req, res) => {
  // Checks views/blog.html first, then falls back to views/articles.html
  res.sendFile(path.join(__dirname, 'views', 'blog.html'), (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'views', 'articles.html'), (err2) => {
        if (err2) res.sendFile(path.join(__dirname, 'views', 'index.html'));
      });
    }
  });
});

// 6. API Route for Blog Data
app.get('/api/posts', (req, res) => {
  db.query('SELECT * FROM posts ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// 7. 404 Route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'), (err) => {
    if (err) res.status(404).send('<h1>404 - Page Not Found</h1>');
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server active on port ${PORT}`);
});
