/**
 * Link+ api.js
 * API 请求封装 / API request wrapper
 */

/* global LinkPlus */

// ── 配置 ──
const API_BASE_URL = 'http://link.codepool.ai/api';

// ── 内部方法：获取 Token ──
async function getStoredToken() {
  const result = await chrome.storage.local.get('linkplus_token');
  return result.linkplus_token || null;
}

async function setStoredToken(token) {
  if (token) {
    await chrome.storage.local.set({ linkplus_token: token });
  } else {
    await chrome.storage.local.remove('linkplus_token');
  }
}

// ── 内部方法：请求封装（通过 background 发送，绕过 CORS 限制）──
async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : API_BASE_URL + endpoint;
  const token = await getStoredToken();

  try {
    const result = await chrome.runtime.sendMessage({
      action: 'api-request',
      url,
      method: options.method || 'GET',
      body: options.body || null,
      token,
    });
    return result;
  } catch (e) {
    console.error('[Link+] API request failed:', e);
    return { success: false, error: '网络请求失败，请检查网络连接', status: 0 };
  }
}

// ── 挂载到 LinkPlus 命名空间 ──
LinkPlus.api = {

  // ========== Token 管理 ==========
  getToken: getStoredToken,
  setToken: setStoredToken,

  // ========== 认证接口 ==========
  async register(email, name, password) {
    const result = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, name, password }),
    });
    if (result.success && result.data.token) {
      await setStoredToken(result.data.token);
    }
    return result;
  },

  async login(email, password) {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.success && result.data.token) {
      await setStoredToken(result.data.token);
    }
    return result;
  },

  async logout() {
    await setStoredToken(null);
    return { success: true };
  },

  async getCurrentUser() {
    return request('/auth/me');
  },

  // ========== 书签接口 ==========
  async getBookmarks(category = null) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/bookmarks${query}`);
  },

  async getCategories() {
    return request('/bookmarks/categories');
  },

  async createBookmark(title, url, category = '未分类') {
    return request('/bookmarks', {
      method: 'POST',
      body: JSON.stringify({ title, url, category }),
    });
  },

  async bulkCreateBookmarks(bookmarks) {
    return request('/bookmarks/bulk', {
      method: 'POST',
      body: JSON.stringify({ bookmarks }),
    });
  },

  async updateBookmark(id, data) {
    return request(`/bookmarks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBookmark(id) {
    return request(`/bookmarks/${id}`, {
      method: 'DELETE',
    });
  },

  async clearBookmarks() {
    return request('/bookmarks/clear', {
      method: 'DELETE',
    });
  },

  // ========== 健康检查 ==========
  async healthCheck() {
    return request('http://link.codepool.ai/health');
  },
};

console.log('[Link+] API module loaded');
