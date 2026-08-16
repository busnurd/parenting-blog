document.addEventListener('DOMContentLoaded', () => {
  // 1. Fetch Dynamic Theme Colors across all pages
  fetch('/api/settings/colors')
    .then(res => res.ok ? res.json() : {})
    .then(colors => {
      if (colors.primary_color) {
        document.documentElement.style.setProperty('--primary-color', colors.primary_color);
      }
      if (colors.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', colors.secondary_color);
      }
    })
    .catch(err => console.warn('Could not load theme settings:', err));

  // 2. Fetch and Render Blog Posts ONLY if on blog container
  const blogContainer = 
    document.getElementById('blog-posts') || 
    document.getElementById('posts-container') || 
    document.querySelector('.blog-grid');

  if (blogContainer) {
    fetch('/api/posts')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(posts => {
        if (!Array.isArray(posts) || posts.length === 0) {
          blogContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">No blog posts published yet.</p>';
          return;
        }

        blogContainer.innerHTML = posts.map(post => `
          <article class="post-card" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; background: #fff;">
            <span class="category-badge" style="background: #e2e8f0; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.85rem;">${post.category || 'General'}</span>
            <h2 style="margin-top: 0.8rem; margin-bottom: 0.5rem;">
              <a href="/post?slug=${post.slug}" style="text-decoration: none; color: inherit;">${post.title}</a>
            </h2>
            <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1rem;">
              By ${post.author || 'Admin'} • ${new Date(post.created_at).toLocaleDateString()}
            </p>
            <p style="margin-bottom: 1rem; color: #334155;">${post.excerpt || ''}</p>
            <a href="/post?slug=${post.slug}" style="font-weight: 600; text-decoration: none;">Read Full Article →</a>
          </article>
        `).join('');
      })
      .catch(err => {
        console.error('Error fetching blog posts:', err);
        blogContainer.innerHTML = '<p style="color:#ef4444; text-align:center; padding: 2rem;">Failed to load posts from database. Please check back shortly.</p>';
      });
  }

  // 3. Single Article Detailed View (/post page)
  const singlePostContainer = document.getElementById('single-post') || document.getElementById('post-content');
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (singlePostContainer && slug) {
    fetch(`/api/posts/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Post not found');
        return res.json();
      })
      .then(post => {
        document.title = `${post.title} | Parenting Blog`;
        singlePostContainer.innerHTML = `
          <article class="single-article" style="max-width: 800px; margin: 0 auto; padding: 2rem 1rem;">
            <h1>${post.title}</h1>
            <p style="color: #64748b; margin-bottom: 2rem;">
              By ${post.author || 'Admin'} • ${new Date(post.created_at).toLocaleDateString()} • Categorized in ${post.category || 'General'}
            </p>
            <div class="article-body" style="line-height: 1.8;">
              ${post.content || post.excerpt || ''}
            </div>
          </article>
        `;
      })
      .catch(err => {
        console.error('Error fetching single post:', err);
        singlePostContainer.innerHTML = '<p style="text-align:center; padding: 2rem;">Article not found.</p>';
      });
  }
});
