/**
 * Link+ toast.js
 * Toast 通知 / Toast notification
 */

/* global LinkPlus */

/**
 * 显示 Toast 通知
 * @param {string} message
 * @param {'success'|'error'} type
 * @param {number} duration ms
 */
LinkPlus.showToast = function(message, type = 'success', duration = 2000) {
  LinkPlus.initShadowDOM();

  if (!LinkPlus.shadowRoot.getElementById('linkplus-toast-container')) {
    LinkPlus.createToastContainer();
  }

  const container = LinkPlus.shadowRoot.getElementById('linkplus-toast-container');
  const toast = document.createElement('div');
  toast.className = `linkplus-toast ${type}`;

  const iconSvg = type === 'success'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>';

  toast.innerHTML = `
    <div class="linkplus-toast-icon">${iconSvg}</div>
    <div class="linkplus-toast-message">${LinkPlus.escapeHtml(message)}</div>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};
