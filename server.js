const express = require('express');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets out of public & root directory
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'views')));

// Railway MySQL Connection Pool
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

// Auto-Create DB Tables & Seed Sample Post if empty
const initDB = () => {
  const createUsersTable = `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), password VARCHAR(255));`;
  const createPostsTable = `CREATE TABLE IF NOT EXISTS posts (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
  const createSettingsTable = `CREATE TABLE IF NOT EXISTS settings (id INT AUTO_INCREMENT PRIMARY KEY, setting_key VARCHAR(50), setting_value TEXT);`;

  db.query(createUsersTable);
  db.query(createSettingsTable);
  db.query(createPostsTable, (err) => {
    if (!err) {
      db.query('SELECT COUNT(*) AS count FROM posts', (err, results) => {
        if (!err && results && results[0].count === 0) {
          db.query(`INSERT INTO posts (title, content) VALUES ('Welcome to Busnurd Technologies', 'This is your first live article loaded from Railway MySQL!')`);
        }
      });
    }
  });
};

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database Connection Error:', err.message);
  } else {
    console.log('✅ Connected to Railway MySQL database successfully.');
    connection.release();
    initDB();
  }
});

// Page HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));
app.get('/resources', (req, res) => res.sendFile(path.join(__dirname, 'views', 'resources.html')));
app.get('/subscribe', (req, res) => res.sendFile(path.join(__dirname, 'views', 'subscribe.html')));
app.get(['/blog', '/blog.html'], (req, res) => res.sendFile(path.join(__dirname, 'views', 'blog.html')));

// API Route: Live Fetch of Blog Posts for frontend polling
app.get('/api/posts', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  db.query('SELECT * FROM posts ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error querying posts:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.json(results || []);
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'), (err) => {
    if (err) res.status(404).send('<h1>404 - Page Not Found</h1>');
  });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
