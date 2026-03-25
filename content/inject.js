/**
 * Link+ inject.js - 入口文件（第一个加载）
 *
 * 加载顺序（由 manifest.json 保证）：
 *   lib/fuse.js
 *   content/inject.js          ← 本文件（先创建命名空间）
 *   content/modules/styles.js
 *   content/modules/ui.js
 *   content/modules/search.js
 *   content/modules/handlers.js
 *   content/modules/toast.js
 */

(function() {
  'use strict';

  // ── 防重复注入 ──
  if (window.__linkplusLoaded) return;
  window.__linkplusLoaded = true;

  // ── 全局命名空间（各模块挂载方法到此对象） ──
  window.LinkPlus = window.LinkPlus || {};
  const LP = window.LinkPlus;

  // ── 状态 ──
  LP.state = {
    isSearchOpen:      false,
    searchQuery:       '',
    bookmarks:         [],
    filteredBookmarks: [],
    selectedIndex:     0,
    fuse:              null,
    isCommandMode:     false,
    commandTag:        null,
    commandTitle:      null,
    activeCategory:    'all',
    // 云同步相关
    isLoggedIn:        false,
    user:              null,
  };

  LP.shadowRoot = null;
  LP.shadowHost = null;

  // ── 工具函数 ──
  LP.escapeHtml = function(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  };

  // ── Shadow DOM 初始化 ──
  // 注意：本函数会在所有模块加载完成后才被调用
  LP.initShadowDOM = function() {
    if (document.getElementById('linkplus-host')) {
      LP.shadowHost = document.getElementById('linkplus-host');
      LP.shadowRoot = LP.shadowHost.shadowRoot;
      // 确保 host 尺寸正确
      LP.shadowHost.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;';
      return;
    }
    LP.shadowHost = document.createElement('div');
    LP.shadowHost.id = 'linkplus-host';
    LP.shadowHost.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;pointer-events:none;';
    LP.shadowRoot = LP.shadowHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    const stylesContent = typeof LP.getStyles === 'function' ? LP.getStyles() : '';
    console.log('[Link+] Styles content length:', stylesContent.length);
    style.textContent = stylesContent;
    LP.shadowRoot.appendChild(style);

    const container = document.createElement('div');
    container.id = 'linkplus-container';
    LP.shadowRoot.appendChild(container);

    document.documentElement.appendChild(LP.shadowHost);
    console.log('[Link+] Shadow DOM initialized');
  };

  // ── 面板控制 ──
  LP.openSearchPanel = async function() {
    console.log('[Link+] openSearchPanel called, isSearchOpen:', LP.state.isSearchOpen);
    if (LP.state.isSearchOpen) return;

    // 安全检查：确保 UI 模块已加载
    if (typeof LP.createSearchPanel !== 'function') {
      console.error('[Link+] UI module not loaded yet');
      return;
    }

    LP.initShadowDOM();
    console.log('[Link+] Shadow DOM initialized, shadowRoot:', !!LP.shadowRoot);

    const existingOverlay = LP.shadowRoot.getElementById('linkplus-overlay');
    console.log('[Link+] existing overlay:', !!existingOverlay);

    if (!existingOverlay) {
      console.log('[Link+] Creating search panel...');
      LP.createSearchPanel();
      LP.createToastContainer();
      try {
        await LP.loadBookmarks();
      } catch (e) {
        console.error('[Link+] loadBookmarks failed:', e);
      }
    }

    const overlay = LP.shadowRoot.getElementById('linkplus-overlay');
    const input   = LP.shadowRoot.getElementById('linkplus-input');

    console.log('[Link+] overlay after create:', !!overlay, 'input:', !!input);

    if (!overlay) {
      console.error('[Link+] overlay not found after creation!');
      return;
    }

    Object.assign(LP.state, {
      isSearchOpen: true, searchQuery: '', selectedIndex: 0,
      isCommandMode: false, commandTag: null, commandTitle: null, activeCategory: 'all',
    });

    overlay.classList.add('active');
    console.log('[Link+] overlay active class added');

    if (input) {
      input.value = '';
      setTimeout(() => { input.focus(); input.select(); }, 50);
    }

    try {
      await LP.loadBookmarks();
      if (typeof LP.performSearch === 'function') {
        LP.performSearch('');
      }
    } catch (e) {
      console.error('[Link+] loadBookmarks failed:', e);
    }
  };

  LP.closeSearchPanel = function() {
    if (!LP.state.isSearchOpen) return;
    const overlay = LP.shadowRoot.getElementById('linkplus-overlay');
    if (overlay) overlay.classList.remove('active');
    LP.state.isSearchOpen = false;
  };

  LP.toggleSearchPanel = function() {
    LP.state.isSearchOpen ? LP.closeSearchPanel() : LP.openSearchPanel();
  };

  // ── 消息监听 ──
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Link+] Message:', request.action);
    switch (request.action) {
      case 'toggle-search':
        LP.toggleSearchPanel();
        sendResponse({ success: true });
        break;
      case 'show-toast':
        LP.showToast(request.message, request.type || 'success');
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    return true;
  });

  // ── 所有同批 content script 同步执行完后，再初始化 Shadow DOM ──
  // setTimeout(0) 确保 modules/*.js 执行完毕，再初始化
  function init() {
    LP.initShadowDOM();
    // 同步初始化不阻塞，syncInit 在后台执行
    if (typeof LP.syncInit === 'function') {
      LP.syncInit().catch(e => console.log('[Link+] syncInit failed:', e));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }

  console.log('[Link+] Content script loaded');
})();
