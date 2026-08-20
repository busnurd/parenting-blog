document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Hamburger Toggle
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const navLinks = document.getElementById('nav-links');

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', () => {
      hamburgerBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    document.addEventListener('click', (event) => {
      if (!hamburgerBtn.contains(event.target) && !navLinks.contains(event.target)) {
        hamburgerBtn.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });
  }

  // 2. Fetch Blog Posts
  const postsContainer = document.getElementById('posts-container');
  if (postsContainer) {
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        return res.json();
      })
      .then((posts) => {
        console.log('Posts fetched from DB:', posts);

        if (!posts || !Array.isArray(posts) || posts.length === 0) {
          postsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No articles published yet.</p>';
          return;
        }

        postsContainer.innerHTML = posts
          .map((post) => {
            // Flexible fallback for column names
            const id = post.id || post.post_id || '';
            const title = post.title || post.post_title || 'Untitled Article';
            const category = post.category || post.tag || 'ARTICLE';
            const rawBody = post.excerpt || post.description || post.content || '';
            const summary = rawBody.replace(/<[^>]*>?/gm, '').substring(0, 130) + '...';

            return `
              <article class="focus-card card">
                <span class="resource-tag">${String(category).toUpperCase()}</span>
                <h3 style="margin-top: 0.5rem; color: var(--color-text);">${title}</h3>
                <p style="font-size: 0.95rem; color: #555; margin: 0.5rem 0;">${summary}</p>
                <a href="/blog/${id}" class="text-link">Read article &rarr;</a>
              </article>
            `;
          })
          .join('');
      })
      .catch((err) => {
        console.error('API Error:', err);
        postsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #8b3a3a;">Error connecting to database. Please check server logs.</p>';
      });
  }
});
