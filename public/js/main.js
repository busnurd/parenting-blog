document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Hamburger Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
  
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');
      });
  
      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('nav-active');
        }
      });
    }
  
    // 2. Fetch & Apply Dynamic Theme Colors from MySQL
    fetch('/api/settings/colors')
      .then(res => res.json())
      .then(colors => {
        Object.keys(colors).forEach(key => {
          document.documentElement.style.setProperty(key, colors[key]);
        });
      })
      .catch(err => console.error('Error fetching theme colors:', err));
  });