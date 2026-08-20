document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Hamburger Toggle Logic
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      if (!hamburgerBtn.contains(event.target) && !navLinks.contains(event.target)) {
        hamburgerBtn.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

  // 2. Dynamic Blog Post Fetcher
  const postsContainer = document.getElementById('posts-container');
  if (postsContainer) {
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((posts) => {
        if (!posts || posts.length === 0) {
          postsContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 2rem;">No articles published yet.</p>';
          return;
        }

        postsContainer.innerHTML = posts
          .map((post) => {
            const title = post.title || 'Untitled Post';
            const category = post.category || post.tag || 'ARTICLE';
            const excerpt = post.excerpt || post.description || post.content || '';
            const truncatedExcerpt = excerpt.length > 120 ? excerpt.substring(0, 120) + '...' : excerpt;
            const postId = post.id || post.post_id || '#';

            return `
              <article class="focus-card card">
                <span class="resource-tag">${category.toUpperCase()}</span>
                <h3 style="margin-top: 0.5rem;">${title}</h3>
                <p style="font-size: 0.95rem; color: #555; margin: 0.5rem 0;">${truncatedExcerpt}</p>
                <a href="/blog/${postId}" class="text-link">Read article &rarr;</a>
              </article>
            `;
          })
          .join('');
      })
      .catch((err) => {
        console.error('Error fetching blog posts:', err);
        postsContainer.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #8b3a3a;">Failed to load articles. Please refresh the page.</p>';
      });
  }
});
