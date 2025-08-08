/**
 * Voar App - Optimized JavaScript Application
 * Modern ES6+ features with performance optimizations
 */

class VoarApp {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupLazyLoading();
    this.setupFormValidation();
    this.setupInfiniteScroll();
  }

  setupEventListeners() {
    // Debounced search
    const searchInput = document.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce(this.handleSearch.bind(this), 300));
    }

    // Form submissions
    document.addEventListener('submit', this.handleFormSubmit.bind(this));

    // Image lazy loading
    document.addEventListener('DOMContentLoaded', this.setupLazyLoading.bind(this));
  }

  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }

  setupInfiniteScroll() {
    const postsContainer = document.querySelector('#posts-container');
    if (!postsContainer) return;

    let isLoading = false;
    let offset = 50;

    const observer = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !isLoading) {
        isLoading = true;
        await this.loadMorePosts(offset);
        offset += 50;
        isLoading = false;
      }
    });

    const sentinel = document.querySelector('#scroll-sentinel');
    if (sentinel) observer.observe(sentinel);
  }

  async loadMorePosts(offset) {
    try {
      const response = await fetch(`/api/posts?offset=${offset}&limit=50`);
      const data = await response.json();
      
      if (data.posts && data.posts.length > 0) {
        this.renderPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }

  renderPosts(posts) {
    const container = document.querySelector('#posts-container');
    if (!container) return;

    const postsHTML = posts.map(post => `
      <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
          <span class="username">@${post.username}</span>
          <span class="timestamp">${this.formatTime(post.created_at)}</span>
        </div>
        <div class="post-content">${this.escapeHtml(post.content)}</div>
        ${post.media_filename ? `<img src="/uploads/${post.media_filename}" alt="Post media" loading="lazy">` : ''}
      </div>
    `).join('');

    container.insertAdjacentHTML('beforeend', postsHTML);
  }

  setupFormValidation() {
    // Real-time validation
    document.addEventListener('input', (e) => {
      if (e.target.matches('input[required], textarea[required]')) {
        this.validateField(e.target);
      }
    });
  }

  validateField(field) {
    const errorElement = field.parentElement.querySelector('.error-message');
    let isValid = true;
    let message = '';

    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      message = 'This field is required';
    } else if (field.type === 'email' && !this.isValidEmail(field.value)) {
      isValid = false;
      message = 'Please enter a valid email';
    } else if (field.type === 'password' && field.value.length < 6) {
      isValid = false;
      message = 'Password must be at least 6 characters';
    }

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = isValid ? 'none' : 'block';
    }

    field.classList.toggle('invalid', !isValid);
    return isValid;
  }

  async handleFormSubmit(e) {
    if (!e.target.matches('form')) return;

    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
    }

    try {
      const response = await fetch(form.action, {
        method: form.method,
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        this.showNotification('Success!', 'success');
        form.reset();
      } else {
        this.showNotification(result.error || 'An error occurred', 'error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this.showNotification('Network error. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    }
  }

  async handleSearch(query) {
    if (!query.trim()) return;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      this.displaySearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  }

  displaySearchResults(results) {
    const container = document.querySelector('#search-results');
    if (!container) return;

    container.innerHTML = results.map(item => `
      <div class="search-result">
        <a href="${item.url}">${this.escapeHtml(item.title)}</a>
      </div>
    `).join('');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Utility for smooth scrolling
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Dark mode toggle
  toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  }

  // Initialize dark mode from localStorage
  initDarkMode() {
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
    }
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  const app = new VoarApp();
  app.initDarkMode();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoarApp;
}
