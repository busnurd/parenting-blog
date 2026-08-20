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
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000
});

db.getConnection()
  .then((conn) => {
    console.log('Connected to MySQL Database successfully');
    conn.release();
  })
  .catch((err) => {
    console.error('Database connection error:', err.message);
  });

// Express dynamic layout renderer with Favicon & Hamburger Menu
function layout(activePage, title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Teen Girls Parenting</title>
  
  <!-- FAVICON FIX -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <nav class="navbar">
      <div class="logo">
        <a href="/"><img src="/Teen Girls Parenting Logo.webp" alt="Teen Girls Parenting Logo"></a>
      </div>

      <!-- HAMBURGER BUTTON FOR MOBILE -->
      <button class="hamburger-btn" id="hamburger-btn" aria-label="Toggle Navigation Menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <ul class="nav-links" id="nav-links">
        <li><a href="/" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
        <li><a href="/about" class="${activePage === 'about' ? 'active' : ''}">About</a></li>
        <li><a href="/blog" class="${activePage === 'blog' ? 'active' : ''}">Blog</a></li>
        <li><a href="/resources" class="${activePage === 'resources' ? 'active' : ''}">Resources</a></li>
        <li><a href="/subscribe" class="btn-primary ${activePage === 'subscribe' ? 'active' : ''}">Subscribe</a></li>
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

// API ENDPOINTS
app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching posts:', err.message);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

// PAGE ROUTES
app.get('/', (req, res) => {
  const content = `
    <main class="homepage container">
      <section class="hero">
        <h1>Thoughtful Guidance for Raising Teenage Daughters</h1>
        <p class="hero-subhead">
          Real mentorship experience and research-backed insights to help you understand, connect with, and raise a confident, resilient daughter.
        </p>
        <div class="hero-buttons">
          <a href="/blog" class="btn-primary">Explore Articles</a>
          <a href="/resources" class="btn-secondary">View Resources</a>
        </div>
      </section>

      <section class="homepage-trust-block card">
        <img src="/founder-photo.webp" alt="Busari Nurudeen Olayemi, founder of Teen Girls Parenting" class="trust-block-photo" />
        <div class="trust-block-content">
          <h2>Written by Someone Who's Actually Done This</h2>
          <p>
            Recognized by UNESCO and the Goi Peace Foundation for mentoring teenage girls to international recognition. Five years as the adult hundreds of girls chose to confide in — not theory, real experience, backed by real research.
          </p>
          <a href="/about" class="text-link">Read the full story &rarr;</a>
        </div>
      </section>

      <section class="focus-areas">
        <h2 style="text-align: center; margin-bottom: 0.5rem;">What We Focus On</h2>
        <p class="section-subhead" style="text-align: center; color: #666; margin-bottom: 1.5rem;">Core pillars designed to support you through every stage of raising a teenage daughter.</p>

        <div class="focus-grid">
          <article class="focus-card card">
            <span class="icon-circle icon-circle--terracotta">&hearts;</span>
            <h3>Understanding Her World</h3>
            <p>Anxiety, body image, and the pressures she carries but rarely says out loud.</p>
            <span class="resource-tag">Emotional Wellbeing</span>
          </article>

          <article class="focus-card card">
            <span class="icon-circle icon-circle--plum">&#128241;</span>
            <h3>Digital Wellness</h3>
            <p>Balanced strategies for screen time, social comparison, and healthy tech habits.</p>
            <span class="resource-tag">Media & Safety</span>
          </article>

          <article class="focus-card card">
            <span class="icon-circle icon-circle--sage">&#127793;</span>
            <h3>Rebuilding Connection</h3>
            <p>Real communication tools for when she goes quiet or pulls away.</p>
            <span class="resource-tag">Relationships</span>
          </article>
        </div>
      </section>

      <section class="recent-articles" style="margin-top: 3rem;">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2>Latest Articles</h2>
          <a href="/blog" class="text-link">View All Articles &rarr;</a>
        </div>
        <div class="article-grid focus-grid" id="posts-container"></div>
      </section>

      <section class="homepage-newsletter card" style="text-align: center; margin-top: 3rem; background: var(--color-cream);">
        <h2>Stop Guessing What to Say to Her</h2>
        <p style="margin: 0.5rem 0 1rem 0;">
          Get the free Conversation Starter Kit — exact words for the moments you feel most stuck — plus one useful parenting email a week.
        </p>
        <form class="subscribe-form-inline" action="/subscribe" method="GET">
          <input type="email" placeholder="Enter your email address" required />
          <button type="submit" class="btn-primary">Get the Free Kit</button>
        </form>
      </section>
    </main>
  `;
  res.send(layout('home', 'Home', content));
});

// 2. About Page (UPDATED WITH 3 RECOGNITION ITEMS & EXACT COPY)
app.get('/about', (req, res) => {
  const content = `
    <main class="about-page container">
      <section class="about-hero" style="text-align: center; margin-bottom: 2rem;">
        <h1>Grounded Guidance for Real-World Parenting</h1>
        <p class="about-subhead" style="font-size: 1.15rem; color: #555; max-width: 700px; margin: 0.5rem auto 0 auto;">
          Bridging real mentorship experience and developmental research with clear, non-judgmental advice for parents of teenage daughters.
        </p>
      </section>

      <section class="about-bio card">
        <img src="/founder-photo.webp" alt="Busari Nurudeen Olayemi, founder of Teen Girls Parenting" class="founder-photo" />

        <h2>Why I Started This</h2>
        <p>
          I wasn't looking to start a movement. I was just the adult they chose to trust. For five years, I worked as an IT professional inside a girls-only secondary school — and slowly, without any announcement, I became the adult those teenage girls talked to. Not their parents. Not their teachers. Me.
        </p>
        <p>
          They told me about anxiety they carried every morning, friendships quietly destroying their self-worth, and the conversations they desperately wanted to have with their own parents but couldn't find the words for. Not because their parents didn't love them — but because love alone doesn't always bridge that silence.
        </p>
        <p>
          I made a promise that what I heard wouldn't stay in that office. This platform is that promise. I'm not a licensed therapist — what I bring is five years of hands-on experience earning teenage girls' trust, paired with published research, not just opinion.
        </p>
      </section>

      <section class="about-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="about-card card">
          <h2>Our Mission</h2>
          <p>
            Modern parenting is filled with overwhelming and conflicting advice. Teen Girls Parenting was founded to cut through the noise with calm, evidence-informed perspective on raising confident, emotionally secure daughters.
          </p>
          <p style="margin-top: 0.75rem;">
            We focus on actionable strategies for communication, emotional regulation, and building resilient parent-daughter connection.
          </p>
        </div>

        <div class="about-card card">
          <h2>Editorial Standards</h2>
          <p>Every piece of advice shared here is checked against trusted developmental research, including:</p>
          <ul class="standards-list" style="margin-top: 0.75rem; list-style: none;">
            <li>&check; Dr. Kristin Neff's research on self-compassion</li>
            <li>&check; NIH / PMC peer-reviewed adolescent development studies</li>
            <li>&check; WHO global adolescent mental health data</li>
            <li>&check; Stanford, CDC, Dove Self-Esteem Project & Journal of Adolescence research</li>
            <li>&check; Zero shaming or perfectionist standards</li>
          </ul>
        </div>
      </section>

      <!-- RECOGNITION & REAL IMPACT (3 RESTRUCTURED ITEMS) -->
      <section class="trust-highlights card">
        <h2>Recognition & Real Impact</h2>

        <div class="trust-grid">
          <!-- Item 1: UNESCO -->
          <article class="trust-card">
            <img src="/unesco-goi-peace-certificate.webp" alt="Certificate of Recognition from Goi Peace Foundation and UNESCO, 2021" />
            <span class="resource-tag">INTERNATIONAL RECOGNITION</span>
            <h3>UNESCO & Goi Peace Foundation, 2021</h3>
            <p>
              In 2021, I trained a team of girls to submit a multimedia proposal on the impact of COVID-19 for an international essay contest. They won a trip to the United States, though lockdown kept us from attending. The Goi Peace Foundation, in partnership with UNESCO, personally recognized the mentorship behind that achievement.
            </p>
          </article>

          <!-- Item 2: Real Impact, Global Reach -->
          <article class="trust-card">
            <img src="/founder-mentoring-moment.webp" alt="Busari Nurudeen Olayemi mentoring teenage girls in the school computer room" />
            <span class="resource-tag">REAL IMPACT</span>
            <h3>Global Reach</h3>
            <p>
              What started in one computer lab has reached further than I ever imagined. Girls I mentored during those five years are now studying medicine, nursing, accounting, robotics engineering, criminology and dozens of other fields across the world. Different countries, different disciplines — but the same thing carried them forward: someone who listened first and believed in them early.
            </p>
          </article>

          <!-- Item 3: Radio Show -->
          <article class="trust-card">
            <img src="/ilubinrin-radio-flyer.webp" alt="Ilubinrin radio show flyer, Splash FM, featuring Busari Nurudeen Olayemi" />
            <span class="resource-tag">MEDIA</span>
            <h3>Ilubinrin, Splash FM</h3>
            <p>
              In September 2025, I was invited onto Ilubinrin, a Yoruba radio programme meaning "women's village," to speak about teenage girls and the silence growing between them and their parents. Mothers called in mid-show. Fathers reached out after. That single broadcast confirmed what five years of listening had already taught me.
            </p>
          </article>
        </div>
      </section>

      <section class="about-cta card" style="text-align: center; margin-top: 2rem;">
        <h2>Want Practical Help, Not Just My Story?</h2>
        <p style="margin: 0.5rem 0 1rem 0;">Get the free Conversation Starter Kit and one useful email a week.</p>
        <a href="/subscribe" class="btn-primary">Get the Free Kit</a>
      </section>
    </main>
  `;
  res.send(layout('about', 'About Us', content));
});

app.get('/blog', (req, res) => {
  const content = `
    <main class="container">
      <h1 style="text-align: center; margin-bottom: 0.5rem;">Parenting Insights & Articles</h1>
      <p style="text-align: center; color: #666; margin-bottom: 2rem;">Practical advice and research-backed frameworks for raising confident teen daughters.</p>
      <div id="posts-container" class="focus-grid"></div>
    </main>
  `;
  res.send(layout('blog', 'Blog', content));
});

app.get('/resources', (req, res) => {
  const content = `
    <main class="resources-page container">
      <section class="resources-hero">
        <h1>Parenting Helplines & Guides</h1>
        <p>Curated support networks, crisis contacts, and downloadable family toolkits.</p>
      </section>

      <section class="resources-grid">
        <article class="resource-card resource-card--featured">
          <span class="resource-tag">FREE DOWNLOAD</span>
          <h2>The First Conversation Starter Kit</h2>
          <p>
            Exact scripts for the moments you feel most stuck — when she shuts down, shuts you out, or won't say what's wrong. Free instant download, plus our weekly email.
          </p>
          <a href="/subscribe" class="btn-primary" style="width: fit-content;">Get the Free Kit</a>
        </article>

        <article class="resource-card">
          <div>
            <span class="resource-tag">24/7 HELPLINE</span>
            <h2>Parent Support Line</h2>
            <p>Confidential emotional support and guidance for parents and caregivers facing immediate stress or crisis.</p>
          </div>
          <a href="#" class="btn-secondary">Call Support Line</a>
        </article>

        <article class="resource-card">
          <div>
            <span class="resource-tag">DIGITAL DOWNLOAD</span>
            <h2>Toddler Emotional Regulation Guide</h2>
            <p>A printable step-by-step cheat sheet for de-escalating tantrums and helping children process big feelings.</p>
          </div>
          <a href="#" class="btn-secondary">Download PDF Guide</a>
        </article>

        <article class="resource-card">
          <div>
            <span class="resource-tag">INTERACTIVE CHECKLIST</span>
            <h2>Screen Time Family Agreement</h2>
            <p>A customizable family contract template to establish healthy tech boundaries for kids and teenagers.</p>
          </div>
          <a href="#" class="btn-secondary">Access Template</a>
        </article>
      </section>
    </main>
  `;
  res.send(layout('resources', 'Resources', content));
});

app.get('/subscribe', (req, res) => {
  const isSuccess = req.query.status === 'success';
  const content = `
    <main class="subscribe-page container">
      <section class="subscribe-hero">
        <h1>Stop Guessing What to Say to Her</h1>
        <p class="subscribe-subhead">
          Get the exact words to use when she shuts down, shuts you out, or won't tell you what's actually wrong — free, in under 5 minutes.
        </p>

        <img src="/conversation-kit-cover.webp" alt="Cover of The First Conversation Starter Kit guide" class="lead-magnet-cover" />

        ${isSuccess ? '<p style="color: green; font-weight: bold; margin-bottom: 1rem;">Success! Check your inbox for your starter kit.</p>' : ''}

        <form class="subscribe-form" action="/subscribe" method="POST">
          <input type="text" id="first-name" name="firstName" placeholder="Your First Name" required />
          <input type="email" id="email" name="email" placeholder="Your Email Address" required />
          <button type="submit" class="btn-primary">Send Me the Free Kit</button>
        </form>

        <ul class="subscribe-checklist">
          <li>&check; Instant access to the First Conversation Starter Kit (PDF)</li>
          <li>&check; One short, useful email a week — real strategies, not fluff</li>
          <li>&check; No spam, no sponsored clutter, unsubscribe anytime</li>
        </ul>

        <p class="trust-microcopy">
          Written by someone who spent years as the adult teenage girls actually talked to — backed by real research, not guesswork.
        </p>
      </section>
    </main>
  `;
  res.send(layout('subscribe', 'Subscribe', content));
});

app.post('/subscribe', async (req, res) => {
  const { firstName, email } = req.body;
  if (!email) {
    return res.status(400).send('Email is required.');
  }
  try {
    console.log(`New Subscriber: ${firstName || 'N/A'} <${email}>`);
    res.redirect('/subscribe?status=success');
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).send('Server error. Please try again.');
  }
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
                }
