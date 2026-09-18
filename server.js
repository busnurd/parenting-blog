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

// Helper function to safely escape HTML output
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

// Auto-Create DB Tables, Upgrade Schema & Seed Sample Posts
const initDB = () => {
  const createUsersTable = `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), password VARCHAR(255));`;
  const createPostsTable = `CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    title VARCHAR(255) NOT NULL, 
    slug VARCHAR(255) UNIQUE,
    category VARCHAR(100) DEFAULT 'Parenting',
    content TEXT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`;
  const createSettingsTable = `CREATE TABLE IF NOT EXISTS settings (id INT AUTO_INCREMENT PRIMARY KEY, setting_key VARCHAR(50), setting_value TEXT);`;

  db.query(createUsersTable);
  db.query(createSettingsTable);
  db.query(createPostsTable, (err) => {
    if (!err) {
      // Ensure category and slug columns exist if table was created previously
      db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;`);
      db.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Parenting';`);

      db.query('SELECT COUNT(*) AS count FROM posts', (err, results) => {
        if (!err && results && results[0].count === 0) {
          db.query(`INSERT INTO posts (title, slug, category, content) VALUES 
            ('Welcome to Busnurd Technologies', 'welcome-to-busnurd-technologies', 'Parenting', 'This is your first live article loaded from Railway MySQL! Learn strategies for effective communication and supporting adolescent growth.')`);
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

// API Route: Live Fetch of Blog Posts with guaranteed slug fallback for frontend links
app.get('/api/posts', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  db.query('SELECT * FROM posts ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error querying posts:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    
    const formattedPosts = (results || []).map(post => ({
      ...post,
      slug: post.slug || String(post.id) || '1'
    }));

    res.json(formattedPosts);
  });
});

// Dynamic Route: Single Post Page (/blog/:slug or /blog/:id)
app.get('/blog/:slug', (req, res, next) => {
  const param = req.params.slug;

  // Skip static files ending with extensions (.html, .css, .js, etc.)
  if (param.includes('.')) return next();

  // Query post by slug, ID, or grab the first post as a ultimate fallback if parameter is undefined/null/1
  const query = 'SELECT * FROM posts WHERE slug = ? OR id = ? OR ? = "undefined" OR ? = "null" OR ? = "1" ORDER BY id ASC LIMIT 1';
  db.query(query, [param, param, param, param, param], (err, results) => {
    if (err || !results || results.length === 0) {
      return res.status(404).sendFile(path.join(__dirname, 'views', '404.html'), (err) => {
        if (err) res.status(404).send('<h1>404 - Article Not Found</h1>');
      });
    }

    const post = results[0];

    // Fetch related articles (excluding the current post)
    db.query('SELECT * FROM posts WHERE id != ? ORDER BY created_at DESC LIMIT 3', [post.id], (relErr, relatedPosts) => {
      const relatedList = relatedPosts || [];

      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHTML(post.title)} | Teen Girls Parenting</title>
          <link rel="icon" type="image/png" href="/favicon.png">
          <link rel="stylesheet" href="/css/style.css">
          <style>
            :root {
              --terracotta: #8b3a3a;
              --plum: #4a2c3d;
              --sage: #5b7065;
              --off-white: #faf8f5;
              --card-bg: #ffffff;
              --text-main: #2b2b2b;
              --border-color: #e5dfd8;
              --radius: 8px;
            }
            body { background-color: var(--off-white); color: var(--text-main); font-family: system-ui, sans-serif; line-height: 1.6; margin: 0; }
            header { background: #fff; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 1000; }
            .navbar { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 1.5rem; }
            .logo img { height: 40px; }
            .nav-links { display: flex; list-style: none; gap: 1.5rem; }
            .nav-links a { text-decoration: none; color: var(--plum); font-weight: 600; }
            .container { max-width: 800px; margin: 0 auto; padding: 2.5rem 1.5rem; }
            .post-article { background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 2.5rem; }
            .post-title { font-size: 2.2rem; color: var(--plum); margin-bottom: 0.5rem; line-height: 1.2; }
            .byline { font-size: 0.95rem; color: var(--sage); margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
            .byline a { color: var(--terracotta); text-decoration: none; font-weight: 600; }
            .post-body { font-size: 1.05rem; line-height: 1.8; color: var(--text-main); }
            
            /* Mid-Article CTA Banner */
            .mid-cta-box { background: #f4efe6; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 2rem; margin: 2.5rem 0; text-align: center; }
            .mid-cta-box h3 { color: var(--plum); font-size: 1.4rem; margin-bottom: 0.5rem; }
            .mid-cta-box p { color: var(--sage); margin-bottom: 1.25rem; font-size: 0.95rem; }
            .mid-cta-form { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
            .mid-cta-form input[type="email"] { padding: 0.7rem 1rem; border: 1px solid var(--border-color); border-radius: var(--radius); min-width: 240px; }
            .mid-cta-form button { background: var(--terracotta); color: #fff; border: none; padding: 0.7rem 1.25rem; border-radius: var(--radius); font-weight: 600; cursor: pointer; }
            .form-msg { margin-top: 0.75rem; font-weight: 600; color: var(--sage); display: none; width: 100%; }
            
            /* Related Posts Grid */
            .related-section { margin-top: 3.5rem; }
            .related-section h3 { font-size: 1.5rem; color: var(--plum); margin-bottom: 1.5rem; }
            .related-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }
            .related-card { background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius); padding: 1.25rem; }
            .related-card h4 { font-size: 1.1rem; margin-bottom: 0.5rem; }
            .related-card h4 a { color: var(--plum); text-decoration: none; }
            footer { text-align: center; padding: 2rem 1.5rem; border-top: 1px solid var(--border-color); background: #ffffff; color: var(--sage); font-size: 0.9rem; margin-top: 3rem; }
          </style>
        </head>
        <body>
          <header>
            <nav class="navbar">
              <div class="logo"><a href="/"><img src="/Teen Girls Parenting Logo.webp" alt="Logo"></a></div>
              <ul class="nav-links">
                <li><a href="/">Home</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/resources">Resources</a></li>
                <li><a href="/subscribe">Subscribe</a></li>
              </ul>
            </nav>
          </header>

          <main class="container">
            <article class="post-article">
              <h1 class="post-title">${escapeHTML(post.title)}</h1>
              <div class="byline">
                By <a href="/about">Busari Nurudeen Olayemi</a> • ${new Date(post.created_at).toLocaleDateString()}
              </div>

              <div class="post-body">
                ${escapeHTML(post.content)}
              </div>

              <!-- Mid-Article CTA -->
              <div class="mid-cta-box">
                <h3>Stop Guessing What to Say to Her</h3>
                <p>Get the free Conversation Starter Kit plus one useful parenting email a week.</p>
                <form class="mid-cta-form" id="cta-form">
                  <input type="email" id="cta-email" placeholder="Enter your email address" required />
                  <button type="submit">Get the Free Kit</button>
                  <div class="form-msg" id="cta-msg">✓ Thank you! Check your inbox soon.</div>
                </form>
              </div>
            </article>

            <!-- Related Posts Section -->
            ${relatedList.length > 0 ? `
              <section class="related-section">
                <h3>Related Articles</h3>
                <div class="related-grid">
                  ${relatedList.map(rel => `
                    <div class="related-card">
                      <h4><a href="/blog/${rel.slug || rel.id}">${escapeHTML(rel.title)}</a></h4>
                      <p style="font-size:0.88rem; color:var(--sage);">${escapeHTML(rel.content ? rel.content.substring(0, 90) + '...' : '')}</p>
                    </div>
                  `).join('')}
                </div>
              </section>
            ` : ''}
          </main>

          <footer>
            <p>&copy; 2026 Teen Girls Parenting. All rights reserved.</p>
          </footer>

          <script>
            document.getElementById('cta-form')?.addEventListener('submit', (e) => {
              e.preventDefault();
              const msg = document.getElementById('cta-msg');
              if (msg) msg.style.display = 'block';
              e.target.reset();
            });
          </script>
        </body>
        </html>
      `);
    });
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'), (err) => {
    if (err) res.status(404).send('<h1>404 - Page Not Found</h1>');
  });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
