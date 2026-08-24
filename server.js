const express = require('express');
const path = require('path');
const mysql = require('mysql2');
require('dotenv').config();

const app = express();

// ==========================================
// 1. DYNAMIC PORT BINDING (RAILWAY COMPATIBLE)
// ==========================================
const PORT = process.env.PORT || 3000;

// ==========================================
// 2. MIDDLEWARE & ABSOLUTE STATIC SERVING
// ==========================================
// Parses incoming JSON and form submission payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serves CSS, JS, and image assets safely from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 3. DATABASE CONNECTION POOL (RAILWAY MYSQL)
// ==========================================
const db = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database: process.env.DB_DATABASE || process.env.MYSQLDATABASE || 'parenting_blog',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test MySQL Database Connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database Connection Error:', err.message);
  } else {
    console.log('✅ Successfully connected to MySQL on Railway!');
    connection.release();
  }
});

// ==========================================
// 4. HTML PAGE ROUTING
// ==========================================

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// About Page
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Resources Page
app.get('/resources', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'resources.html'));
});

// Subscribe Page
app.get('/subscribe', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'subscribe.html'));
});

// ==========================================
// 5. API ENDPOINTS & FORM SUBMISSIONS
// ==========================================

// Handle Newsletter / Email Subscription Submissions
app.post('/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const query = 'INSERT INTO subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE email=email';

  db.query(query, [email], (err, result) => {
    if (err) {
      console.error('Error inserting subscriber:', err);
      return res.status(500).json({ error: 'Database error occurred. Please try again.' });
    }

    console.log(`New subscriber registered: ${email}`);
    
    // If request comes from standard form submission, redirect back or to confirmation
    if (req.headers['content-type'] === 'application/x-www-form-urlencoded') {
      return res.redirect('/subscribe?status=success');
    }

    // Otherwise return JSON response for fetch/AJAX calls
    return res.status(200).json({ success: true, message: 'Successfully subscribed!' });
  });
});

// Wildcard Fallback Route for 404 Pages
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
    if (err) {
      res.status(404).send('<h1>404 - Page Not Found</h1>');
    }
  });
});

// ==========================================
// 6. START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server is active and listening on port ${PORT}`);
});
