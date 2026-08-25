/**
 * Busnurd Technologies - Parenting Blog Main Script
 * Global UI Handler & Mobile Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. Mobile Hamburger Menu Toggle
  // ==========================================
  const hamburgerBtn = document.getElementById('hamburger-btn') || document.querySelector('.hamburger');
  const navMenu = document.getElementById('nav-menu') || document.querySelector('.nav-menu') || document.querySelector('nav ul');

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hamburgerBtn.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburgerBtn.contains(e.target) && !navMenu.contains(e.target)) {
        hamburgerBtn.classList.remove('active');
        navMenu.classList.remove('active');
      }
    });

    // Close menu when tapping a link on mobile
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburgerBtn.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // ==========================================
  // 2. Active Page Link Highlighting
  // ==========================================
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('nav a, .nav-menu a');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/index.html')) {
      link.classList.add('active');
    }
  });

  // ==========================================
  // 3. Dynamic Blog / Article Fetcher
  // ==========================================
  const postsContainer = document.getElementById('posts-container') || document.getElementById('articles-container') || document.querySelector('.articles-list');

  if (postsContainer) {
    fetchBlogPosts(postsContainer);
  }
});

/**
 * Fetches published posts from the backend Railway MySQL API
 * @param {HTMLElement} container 
 */
function fetchBlogPosts(container) {
  fetch('/api/posts')
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(posts => {
      if (!posts || posts.length === 0) {
        container.innerHTML = `
          <div class="no-posts" style="text-align: center; padding: 2rem;">
            <p>No articles published yet. Check back soon!</p>
          </div>`;
        return;
      }

      container.innerHTML = posts.map(post => `
        <article class="post-card">
          <h2>${escapeHTML(post.title)}</h2>
          <p>${escapeHTML(post.content)}</p>
          <span class="meta">Published on ${new Date(post.created_at).toLocaleDateString()}</span>
        </article>
      `).join('');
    })
    .catch(error => {
      console.error('Error fetching blog posts:', error);
      container.innerHTML = `
        <div class="error-message" style="text-align: center; color: #e53e3e; padding: 2rem;">
          <p>Unable to load posts right now. Please try refreshing the page.</p>
        </div>`;
    });
}

/**
 * Utility: Sanitizes input to prevent XSS issues
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
