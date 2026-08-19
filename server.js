const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MySQL Database Connection Pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'parenting_blog',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test Database Connection
db.getConnection()
  .then((conn) => {
    console.log('Connected to MySQL Database successfully');
    conn.release();
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
  });

// Express dynamic layout renderer
function layout(activePage, title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Teen Girls Parenting</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <nav class="navbar">
      <div class="logo">
        <a href="/"><img src="/Teen Girls Parenting Logo.webp" alt="Teen Girls Parenting Logo"></a>
      </div>
      <ul class="nav-links">
        <li><a href="/" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
        <li><a href="/about" class="${activePage === 'about' ? 'active' : ''}">About</a></li>
        <li><a href="/blog" class="${activePage === 'blog' ? 'active' : ''}">Blog</a></li>
        <li><a href="/resources" class="${activePage === 'resources' ? 'active' : ''}">Resources</a></li>
        <li><a href="/subscribe" class="${activePage === 'subscribe' ? 'active' : ''}">Subscribe</a></li>
      </ul>
    </nav>
  </header>

  <main>
    ${bodyContent}
  </main>

  <footer>
    <p>&copy; 2026 Teen Girls Parenting. All rights reserved.</p>
  </footer>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

// ==========================================
// API ENDPOINTS FOR FRONTEND (js/main.js)
// ==========================================

// Get all blog posts
app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching posts:', err.message);
    res.status(500).json({ error: 'Failed to load posts from database' });
  }
});

// Get single blog post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching single post:', err.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// ==========================================
// PAGE ROUTES
// ==========================================

// 1. Home Page
app.get('/', (req, res) => {
  const content = `
    <section class="hero">
      <h1>Research-Backed Guidance for Raising Confident Teen Daughters</h1>
      <p class="hero-subhead">Practical advice, real experience, and actionable toolkits for parents navigating the teenage years.</p>
      <div class="hero-buttons">
        <a href="/subscribe" class="btn-primary">Get the Free Toolkit</a>
        <a href="/blog" class="btn-secondary">Read Latest Articles</a>
      </div>
    </section>

    <div class="container">
      <section class="homepage-trust-block card">
        <img src="/founder-photo.webp" alt="Busari Nurudeen Olayemi" class="trust-block-photo">
        <div class="trust-block-content">
          <h2>Written by Someone Who's Actually Done This</h2>
          <p>
            Recognized by UNESCO and the Goi Peace Foundation for mentoring teenage girls to international recognition. 
            Five years as the adult hundreds of girls chose to confide in — not theory, real experience, backed by real research.
          </p>
          <a href="/about" class="text-link">Read the full story &rarr;</a>
        </div>
      </section>

      <section class="latest-posts-section">
        <h2 style="text-align: center; margin-bottom: 1.5rem;">Recent Insights</h2>
        <div id="posts-container" class="focus-grid">
          <!-- Populated by main.js fetching /api/posts -->
        </div>
      </section>
    </div>
  `;
  res.send(layout('home', 'Home', content));
});

// 2. About Page
app.get('/about', (req, res) => {
  const content = `
    <div class="container about-page">
      <section class="card about-bio">
        <img src="/founder-photo.webp" alt="Busari Nurudeen Olayemi" class="founder-photo">
        <h1>About the Founder</h1>
        <p>Hi, I'm <strong>Busari Nurudeen Olayemi</strong>.</p>
        <p>Over the past five years, I have worked directly with hundreds of teenage girls, guiding them through identity, confidence, and real-world challenges. Recognized by UNESCO and the Goi Peace Foundation, this platform is dedicated to bridging the communication gap between parents and their teen daughters.</p>
      </section>
    </div>
  `;
  res.send(layout('about', 'About Us', content));
});

// 3. Blog Page
app.get('/blog', (req, res) => {
  const content = `
    <div class="container">
      <h1 style="text-align: center; margin-bottom: 2rem;">Parenting Insights & Articles</h1>
      <div id="posts-container" class="focus-grid">
        <!-- Populated by main.js fetching /api/posts -->
      </div>
    </div>
  `;
  res.send(layout('blog', 'Blog', content));
});

// 4. Resources Page
app.get('/resources', (req, res) => {
  const content = `
    <div class="container resources-page">
      <div class="resources-hero">
        <h1>Parenting Guides & Free Toolkits</h1>
        <p>Download structured guides to help navigate conversation starters, trust building, and modern teenage challenges.</p>
      </div>
      <div class="resources-grid">
        <div class="resource-card resource-card--featured">
          <div>
            <span class="resource-tag">Featured Kit</span>
            <h2>Teen Girl Communication Toolkit</h2>
            <p>5 actionable frameworks to start conversations without pushing your daughter away.</p>
          </div>
          <a href="/subscribe" class="btn-primary">Download Free Copy</a>
        </div>
      </div>
    </div>
  `;
  res.send(layout('resources', 'Resources', content));
});

// 5. Subscribe Page (GET)
app.get('/subscribe', (req, res) => {
  const isSuccess = req.query.status === 'success';
  const content = `
    <div class="container subscribe-page">
      <div class="subscribe-hero">
        <h1>Get the Free Teen Daughter Communication Guide</h1>
        <p class="subscribe-subhead">Join hundreds of parents receiving weekly research-backed strategies straight to their inbox.</p>
        
        ${isSuccess ? '<p style="color: green; font-weight: bold; margin-bottom: 1rem;">Success! You are now subscribed.</p>' : ''}

        <form action="/subscribe" method="POST" class="subscribe-form">
          <input type="text" name="name" placeholder="Your Name" required>
          <input type="email" name="email" placeholder="Your Email Address" required>
          <button type="submit" class="btn-primary">Send Me The Free Guide</button>
        </form>

        <ul class="subscribe-checklist">
          <li>&check; 100% free, actionable advice</li>
          <li>&check; No spam, unsubscribe at any time</li>
        </ul>
      </div>
    </div>
  `;
  res.send(layout('subscribe', 'Subscribe', content));
});

// 6. Subscribe Action (POST)
app.post('/subscribe', async (req, res) => {
  const { name, email } = req.body;
  if (!email) {
    return res.status(400).send('Email is required.');
  }

  try {
    console.log(`New Subscriber: ${name || 'N/A'} <${email}>`);
    res.redirect('/subscribe?status=success');
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).send('Server error. Please try again.');
  }
});

// Export app for Vercel / server execution
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
