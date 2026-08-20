document.addEventListener('DOMContentLoaded', () => {
  // Mobile Hamburger Toggle
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

  // Fetch Blog Posts with Resilient Error Handling
  const postsContainer = document.getElementById('posts-container');
  if (postsContainer) {
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) throw new Error('Database connection issue');
        return res.json();
      })
      .then((posts) => {
        if (!posts || !Array.isArray(posts) || posts.length === 0) {
          postsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #666;">No articles published yet.</p>';
          return;
        }

        postsContainer.innerHTML = posts
          .map((post) => {
            const id = post.id || post.post_id || '';
            const title = post.title || post.post_title || 'Untitled Article';
            const category = post.category || post.tag || 'ARTICLE';
            const rawBody = post.excerpt || post.description || post.content || '';
            const summary = rawBody.replace(/<[^>]*>?/gm, '').substring(0, 120) + '...';

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
        console.warn('API connection failed:', err);
        postsContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px;">
            <p style="color: #c53030; font-weight: 600; margin-bottom: 0.25rem;">Unable to load articles right now.</p>
            <p style="color: #742a2a; font-size: 0.9rem;">Please check back shortly or verify your MySQL database connection credentials on Vercel/environment setup.</p>
          </div>
        `;
      });
  }
});
