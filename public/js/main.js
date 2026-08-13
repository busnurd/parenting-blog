document.addEventListener('DOMContentLoaded', () => {
  loadBlogPosts();
  loadSinglePost();
});

// Fetch and render all posts for index.html or blog.html
async function loadBlogPosts() {
  const container = document.getElementById('posts-container');
  if (!container) return;

  try {
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('Failed to load posts');

    const posts = await response.json();

    if (posts.length === 0) {
      container.innerHTML = '<p class="no-posts">No blog posts found.</p>';
      return;
    }

    container.innerHTML = posts.map(post => `
      <article class="post-card">
        <span class="category">${post.category || 'General'}</span>
        <h3><a href="/post?slug=${post.slug}">${post.title}</a></h3>
        <p>${post.excerpt}</p>
        <div class="post-meta">
          <span class="author">By ${post.author || 'Admin'}</span>
          <span class="date">${new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </article>
    `).join('');
  } catch (err) {
    console.error('Error fetching blog posts:', err);
    container.innerHTML = '<p class="error-msg">Unable to load posts at this time.</p>';
  }
}

// Fetch and render a single post for post.html
async function loadSinglePost() {
  const titleElem = document.getElementById('post-title');
  const contentElem = document.getElementById('post-content');
  const metaElem = document.getElementById('post-meta');

  if (!titleElem || !contentElem) return;

  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    titleElem.textContent = 'Post Not Found';
    contentElem.innerHTML = '<p>No post identifier provided.</p>';
    return;
  }

  try {
    const response = await fetch(`/api/posts/${slug}`);
    if (!response.ok) throw new Error('Post not found');

    const post = await response.json();

    titleElem.textContent = post.title;
    contentElem.innerHTML = post.content || `<p>${post.excerpt}</p>`;
    if (metaElem) {
      metaElem.innerHTML = `<span>Category: ${post.category || 'General'}</span> | <span>Published: ${new Date(post.created_at).toLocaleDateString()}</span>`;
    }
  } catch (err) {
    console.error('Error fetching single post:', err);
    titleElem.textContent = 'Error Loading Post';
    contentElem.innerHTML = '<p>Could not retrieve post content.</p>';
  }
}
