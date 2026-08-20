document.addEventListener('DOMContentLoaded', () => {
  // Mobile Hamburger Toggle Logic
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

  // Dynamic Blog Post Loader (if on blog or home page)
  const postsContainer = document.getElementById('posts-container');
  if (postsContainer) {
    fetch('/api/posts')
      .then((res) => res.json())
      .then((posts) => {
        if (!posts || posts.length === 0) {
          postsContainer.innerHTML = '<p>No articles published yet.</p>';
          return;
        }
        postsContainer.innerHTML = posts
          .map(
            (post) => `
            <article class="focus-card card">
              <span class="resource-tag">${post.category || 'ARTICLE'}</span>
              <h3 style="margin-top: 0.5rem;">${post.title}</h3>
              <p style="font-size: 0.95rem; color: #555; margin: 0.5rem 0;">${post.excerpt || ''}</p>
              <a href="/blog/${post.id}" class="text-link">Read article &rarr;</a>
            </article>
          `
          )
          .join('');
      })
      .catch((err) => {
        console.error('Error loading posts:', err);
      });
  }
});
