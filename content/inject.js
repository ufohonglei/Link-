/**
 * Link+ Content Script - inject.js
 * 
 * 功能：
 * 1. 创建 Shadow DOM 容器，实现样式隔离
 * 2. 渲染搜索面板和 Toast 通知 UI
 * 3. 处理键盘事件（快捷键、导航、选择）
 * 4. 与 background.js 通信
 */

(function() {
  'use strict';

  // ============================================
  // 状态管理 / State Management
  // ============================================
  
  const state = {
    isSearchOpen: false,
    searchQuery: '',
    bookmarks: [],
    filteredBookmarks: [],
    selectedIndex: 0,
    fuse: null,
    isCommandMode: false, // 是否为指令添加模式 / Is command mode (starts with +)
    commandTag: null, // 指令中的标签 / Tag in command
    commandTitle: null, // 指令中的自定义标题 / Custom title in command
    activeCategory: 'all' // 当前选中的分类 / Current selected category
  };

  // ============================================
  // Shadow DOM 初始化 / Shadow DOM Initialization
  // ============================================
  
  let shadowRoot = null;
  let shadowHost = null;

  /**
   * 初始化 Shadow DOM
   * Initialize Shadow DOM
   */
  function initShadowDOM() {
    // 检查是否已存在 / Check if already exists
    if (document.getElementById('linkplus-host')) {
      shadowHost = document.getElementById('linkplus-host');
      shadowRoot = shadowHost.shadowRoot;
      return;
    }

    // 创建 Shadow Host / Create Shadow Host
    shadowHost = document.createElement('div');
    shadowHost.id = 'linkplus-host';
    shadowHost.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: 2147483647;
    `;

    // 附加 Shadow Root / Attach Shadow Root
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    // 创建样式元素 / Create style element
    const style = document.createElement('style');
    style.textContent = getStyles();
    shadowRoot.appendChild(style);

    // 创建容器 / Create container
    const container = document.createElement('div');
    container.id = 'linkplus-container';
    shadowRoot.appendChild(container);

    // 添加到页面 / Append to page
    document.documentElement.appendChild(shadowHost);

    console.log('[Link+] Shadow DOM initialized');
  }

  /**
   * 获取样式内容
   * Get style content
   * @returns {string} CSS 样式 / CSS styles
   */
  function getStyles() {
    return `
      /* ============================================
         Link+ Styles - Dark Theme with Glassmorphism
         ============================================ */

      :host {
        all: initial;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      /* 搜索面板遮罩 / Search Panel Overlay */
      .linkplus-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 120px;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, visibility 0.2s ease;
        z-index: 2147483647;
      }

      .linkplus-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      /* 搜索面板 / Search Panel */
      .linkplus-panel {
        width: 640px;
        max-width: 90vw;
        background: rgba(30, 30, 35, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 
          0 25px 50px -12px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.05);
        overflow: hidden;
        transform: scale(0.95) translateY(-10px);
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .linkplus-overlay.active .linkplus-panel {
        transform: scale(1) translateY(0);
      }

      /* 搜索输入框 / Search Input */
      .linkplus-search-box {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .linkplus-search-icon {
        width: 20px;
        height: 20px;
        margin-right: 12px;
        color: rgba(255, 255, 255, 0.5);
        flex-shrink: 0;
      }

      .linkplus-search-icon.command-mode {
        color: #10b981;
      }

      .linkplus-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: #fff;
        font-size: 16px;
        font-weight: 400;
        line-height: 1.5;
      }

      .linkplus-input::placeholder {
        color: rgba(255, 255, 255, 0.35);
      }

      .linkplus-shortcut-hint {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.35);
        margin-left: 12px;
        white-space: nowrap;
      }

      /* 底部操作按钮 / Footer Actions */
      .linkplus-footer-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .linkplus-footer-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.15s ease;
        border: 1px solid transparent;
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
      }

      .linkplus-footer-btn .linkplus-icon {
        width: 12px;
        height: 12px;
      }

      .linkplus-footer-tutorial:hover {
        background: rgba(59, 130, 246, 0.15);
        border-color: rgba(59, 130, 246, 0.3);
        color: rgba(59, 130, 246, 0.9);
      }

      .linkplus-footer-settings:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.9);
      }

      .linkplus-footer-clear:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.3);
        color: rgba(239, 68, 68, 0.9);
      }

      .linkplus-footer-btn:active {
        transform: scale(0.95);
      }

      /* 指令模式提示 / Command Mode Hint */
      .linkplus-command-hint {
        padding: 8px 20px;
        background: rgba(16, 185, 129, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 13px;
        color: #10b981;
        display: none;
      }

      .linkplus-command-hint.active {
        display: block;
      }

      /* 分类标签栏 / Category Tabs */
      .linkplus-category-bar {
        display: none;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 6px;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        scrollbar-width: none;
      }

      .linkplus-category-bar::-webkit-scrollbar {
        display: none;
      }

      .linkplus-category-tab {
        flex-shrink: 0;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid transparent;
        border-radius: 20px;
        padding: 4px 12px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .linkplus-category-tab:hover {
        background: rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.9);
      }

      .linkplus-category-tab.active {
        background: rgba(99, 102, 241, 0.25);
        border-color: rgba(99, 102, 241, 0.5);
        color: #a5b4fc;
      }

      .linkplus-category-count {
        font-size: 11px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        padding: 1px 6px;
        color: rgba(255, 255, 255, 0.5);
      }

      .linkplus-category-tab.active .linkplus-category-count {
        background: rgba(99, 102, 241, 0.3);
        color: #a5b4fc;
      }

      /* 搜索结果列表 / Search Results List */
      .linkplus-results {
        max-height: 400px;
        overflow-y: auto;
        padding: 8px;
      }

      .linkplus-results::-webkit-scrollbar {
        width: 6px;
      }

      .linkplus-results::-webkit-scrollbar-track {
        background: transparent;
      }

      .linkplus-results::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 3px;
      }

      /* 结果项 / Result Item */
      .linkplus-result-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .linkplus-result-item:hover,
      .linkplus-result-item.selected {
        background: rgba(255, 255, 255, 0.08);
      }

      .linkplus-result-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;
        font-size: 14px;
      }

      .linkplus-result-content {
        flex: 1;
        min-width: 0;
      }

      .linkplus-result-title {
        color: #fff;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .linkplus-result-url {
        color: rgba(255, 255, 255, 0.45);
        font-size: 12px;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-top: 2px;
      }

      .linkplus-result-folder {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.35);
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 8px;
        border-radius: 4px;
        margin-left: 8px;
        flex-shrink: 0;
      }

      /* 编辑按钮 / Edit Button */
      .linkplus-edit-btn {
        background: transparent;
        border: none;
        padding: 6px;
        margin-left: 8px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s ease;
        border-radius: 4px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .linkplus-edit-btn .linkplus-icon {
        width: 14px;
        height: 14px;
        color: rgba(59, 130, 246, 0.8);
      }

      .linkplus-result-item:hover .linkplus-edit-btn {
        opacity: 1;
      }

      .linkplus-edit-btn:hover {
        background: rgba(59, 130, 246, 0.2);
        transform: scale(1.1);
      }

      .linkplus-edit-btn:hover .linkplus-icon {
        color: rgba(59, 130, 246, 1);
      }

      .linkplus-edit-btn:active {
        transform: scale(0.95);
      }

      /* 删除按钮 / Delete Button */
      .linkplus-delete-btn {
        background: transparent;
        border: none;
        padding: 6px;
        margin-left: 4px;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s ease;
        border-radius: 4px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .linkplus-delete-btn .linkplus-icon {
        width: 14px;
        height: 14px;
        color: rgba(239, 68, 68, 0.8);
      }

      .linkplus-result-item:hover .linkplus-delete-btn {
        opacity: 1;
      }

      .linkplus-delete-btn:hover {
        background: rgba(239, 68, 68, 0.2);
        transform: scale(1.1);
      }

      .linkplus-delete-btn:hover .linkplus-icon {
        color: rgba(239, 68, 68, 1);
      }

      .linkplus-delete-btn:active {
        transform: scale(0.95);
      }

      /* 空状态 / Empty State */
      .linkplus-empty {
        padding: 40px 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.4);
        font-size: 14px;
      }

      .linkplus-empty-icon {
        font-size: 32px;
        margin-bottom: 12px;
        opacity: 0.5;
      }

      /* 底部提示 / Footer Hints */
      .linkplus-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        font-size: 12px;
        color: rgba(255, 255, 255, 0.35);
      }

      .linkplus-footer-hint {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .linkplus-key {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-family: 'SF Mono', Monaco, monospace;
      }

      /* 教程弹窗 / Tutorial Modal */
      .linkplus-tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
      }

      .linkplus-tutorial-content {
        width: 600px;
        max-width: 90vw;
        max-height: 80vh;
        background: rgba(30, 30, 35, 0.98);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .linkplus-tutorial-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .linkplus-tutorial-header h2 {
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        margin: 0;
      }

      .linkplus-tutorial-close {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.15s ease;
      }

      .linkplus-tutorial-close:hover {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.1);
      }

      .linkplus-tutorial-body {
        padding: 20px;
        overflow-y: auto;
        color: rgba(255, 255, 255, 0.85);
        font-size: 14px;
        line-height: 1.6;
      }

      .linkplus-tutorial-body section {
        margin-bottom: 20px;
      }

      .linkplus-tutorial-body h3 {
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 12px 0;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .linkplus-tutorial-body h4 {
        color: rgba(255, 255, 255, 0.9);
        font-size: 14px;
        font-weight: 500;
        margin: 12px 0 8px 0;
      }

      .linkplus-tutorial-body ul,
      .linkplus-tutorial-body ol {
        margin: 8px 0;
        padding-left: 20px;
      }

      .linkplus-tutorial-body li {
        margin: 6px 0;
      }

      .linkplus-tutorial-body kbd {
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.9);
      }

      .linkplus-tutorial-body code {
        background: rgba(255, 255, 255, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 13px;
        color: #10b981;
      }

      .linkplus-tutorial-method {
        background: rgba(255, 255, 255, 0.03);
        padding: 12px;
        border-radius: 8px;
        margin: 8px 0;
      }

      .linkplus-tutorial-examples,
      .linkplus-tutorial-tips {
        margin-top: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
      }

      .linkplus-tutorial-examples p,
      .linkplus-tutorial-tips p {
        margin: 0 0 8px 0;
        color: rgba(255, 255, 255, 0.7);
      }

      /* Toast 通知 / Toast Notification */
      .linkplus-toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .linkplus-toast {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(30, 30, 35, 0.98);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        color: #fff;
        font-size: 14px;
        transform: translateX(120%);
        opacity: 0;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
        max-width: 320px;
      }

      .linkplus-toast.show {
        transform: translateX(0);
        opacity: 1;
      }

      .linkplus-toast-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .linkplus-toast.success .linkplus-toast-icon {
        color: #10b981;
      }

      .linkplus-toast.error .linkplus-toast-icon {
        color: #ef4444;
      }

      .linkplus-toast-message {
        flex: 1;
      }
    `;
  }

  // ============================================
  // UI 渲染 / UI Rendering
  // ============================================

  /**
   * 创建搜索面板
   * Create search panel
   */
  function createSearchPanel() {
    const container = shadowRoot.getElementById('linkplus-container');
    
    // 创建遮罩层 / Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'linkplus-overlay';
    overlay.id = 'linkplus-overlay';
    
    // 点击遮罩关闭 / Click overlay to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeSearchPanel();
      }
    });

    // 创建面板 / Create panel
    const panel = document.createElement('div');
    panel.className = 'linkplus-panel';
    
    // 搜索框 / Search box
    const searchBox = document.createElement('div');
    searchBox.className = 'linkplus-search-box';
    searchBox.innerHTML = `
      <svg class="linkplus-search-icon" id="linkplus-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input type="text" class="linkplus-input" id="linkplus-input" placeholder="搜索书签..." autocomplete="off">
      <span class="linkplus-shortcut-hint">ESC 关闭</span>
    `;
    
    // 指令模式提示 / Command mode hint
    const commandHint = document.createElement('div');
    commandHint.className = 'linkplus-command-hint';
    commandHint.id = 'linkplus-command-hint';
    commandHint.textContent = '按 Enter 保存当前页面，使用 #标签 自动归类';
    
    // 分类标签栏 / Category tabs
    const categoryBar = document.createElement('div');
    categoryBar.className = 'linkplus-category-bar';
    categoryBar.id = 'linkplus-category-bar';
    
    // 结果列表 / Results List
    const results = document.createElement('div');
    results.className = 'linkplus-results';
    results.id = 'linkplus-results';
    
    // 底部提示 / Footer
    const footer = document.createElement('div');
    footer.className = 'linkplus-footer';
    footer.innerHTML = `
      <div class="linkplus-footer-hint">
        <span class="linkplus-key">↑↓</span>
        <span>导航</span>
      </div>
      <div class="linkplus-footer-actions">
        <button class="linkplus-footer-btn linkplus-footer-tutorial" id="linkplus-tutorial-btn" title="使用教程">
          <svg class="linkplus-icon" viewBox="0 0 1024 1024" fill="currentColor">
            <path d="M938.666667 379.733333c0-17.066667-8.533333-29.866667-25.6-38.4l-366.933334-162.133333c-21.333333-8.533333-46.933333-8.533333-68.266666 0L110.933333 345.6c-17.066667 8.533333-25.6 21.333333-25.6 38.4s8.533333 29.866667 25.6 38.4L213.333333 469.333333v213.333334c0 34.133333 17.066667 64 46.933334 76.8 4.266667 0 4.266667 4.266667 8.533333 4.266666l209.066667 85.333334c21.333333 8.533333 42.666667 8.533333 64 0l209.066666-85.333334c4.266667 0 8.533333-4.266667 8.533334-4.266666 29.866667-12.8 46.933333-42.666667 46.933333-76.8v-213.333334l42.666667-21.333333V597.333333c0 25.6 17.066667 42.666667 42.666666 42.666667s42.666667-17.066667 42.666667-42.666667l4.266667-217.6c0 4.266667 0 0 0 0zM725.333333 682.666667l-179.2 72.533333c-21.333333 8.533333-42.666667 8.533333-64 0L298.666667 682.666667v-174.933334l179.2 81.066667c21.333333 8.533333 46.933333 8.533333 68.266666 0l179.2-81.066667V682.666667z m-213.333333-174.933334L230.4 384 512 256l281.6 123.733333-281.6 128z"></path>
          </svg>
          <span>教程</span>
        </button>
        <button class="linkplus-footer-btn linkplus-footer-settings" id="linkplus-settings-btn" title="设置快捷键">
          <svg class="linkplus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>设置</span>
        </button>
        <button class="linkplus-footer-btn linkplus-footer-clear" id="linkplus-clear-btn" title="清空所有收藏">
          <svg class="linkplus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <span>清空</span>
        </button>
      </div>
    `;

    panel.appendChild(searchBox);
    panel.appendChild(commandHint);
    panel.appendChild(categoryBar);
    panel.appendChild(results);
    panel.appendChild(footer);
    overlay.appendChild(panel);
    container.appendChild(overlay);

    // 绑定输入事件 / Bind input events
    const input = shadowRoot.getElementById('linkplus-input');
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown);
    
    // 绑定教程按钮事件 / Bind tutorial button event
    const tutorialBtn = shadowRoot.getElementById('linkplus-tutorial-btn');
    tutorialBtn.addEventListener('click', handleOpenTutorial);
    
    // 绑定设置按钮事件 / Bind settings button event
    const settingsBtn = shadowRoot.getElementById('linkplus-settings-btn');
    settingsBtn.addEventListener('click', handleOpenSettings);
    
    // 绑定清空按钮事件 / Bind clear button event
    const clearBtn = shadowRoot.getElementById('linkplus-clear-btn');
    clearBtn.addEventListener('click', handleClearAll);
  }

  /**
   * 创建 Toast 容器
   * Create toast container
   */
  function createToastContainer() {
    const container = shadowRoot.getElementById('linkplus-container');
    
    const toastContainer = document.createElement('div');
    toastContainer.className = 'linkplus-toast-container';
    toastContainer.id = 'linkplus-toast-container';
    
    container.appendChild(toastContainer);
  }

  // ============================================
  // 搜索逻辑 / Search Logic
  // ============================================

  /**
   * 初始化 Fuse.js
   * Initialize Fuse.js
   */
  function initFuse() {
    if (typeof Fuse === 'undefined') {
      console.error('[Link+] Fuse.js not loaded');
      return;
    }

    const options = {
      keys: ['title', 'url', 'folder'],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 1
    };

    state.fuse = new Fuse(state.bookmarks, options);
  }

  /**
   * 加载书签数据
   * Load bookmarks data
   */
  async function loadBookmarks() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'get-bookmarks' });
      if (response.success) {
        state.bookmarks = response.data;
        initFuse();
      }
    } catch (error) {
      console.error('[Link+] Failed to load bookmarks:', error);
    }
  }

  /**
   * 处理输入
   * Handle input
   * @param {Event} e - 输入事件 / Input event
   */
  function handleInput(e) {
    const query = e.target.value.trim();
    state.searchQuery = query;
    
    // 检查是否为指令模式 / Check if command mode
    state.isCommandMode = query.startsWith('+');
    
    // 更新 UI / Update UI
    updateSearchIcon();
    updateCommandHint();
    
    if (state.isCommandMode) {
      // 解析指令 / Parse command
      parseCommand(query);
      // 指令模式下不显示搜索结果 / Don't show search results in command mode
      renderResults([]);
    } else {
      // 执行搜索 / Perform search
      performSearch(query);
    }
  }

  /**
   * 解析指令
   * Parse command
   * @param {string} query - 输入内容 / Input content
   */
  function parseCommand(query) {
    // 移除开头的 + / Remove leading +
    const content = query.substring(1).trim();
    
    // 解析标签 / Parse tag (支持 #标签 在任意位置)
    const tagMatch = content.match(/#([^\s#]+)/);
    state.commandTag = tagMatch ? tagMatch[1] : null;
    
    // 解析自定义标题 / Parse custom title
    // 移除标签部分得到标题 / Remove tag part to get title
    state.commandTitle = content.replace(/#[^\s#]+/g, '').trim();
  }

  /**
   * 执行搜索
   * Perform search
   * @param {string} query - 搜索关键词 / Search query
   */
  function performSearch(query) {
    let results;
    if (!query) {
      // 显示所有书签 / Show all bookmarks
      results = state.bookmarks;
    } else if (state.fuse) {
      // 使用 Fuse.js 搜索 / Use Fuse.js to search
      results = state.fuse.search(query).map(r => r.item);
    } else {
      results = [];
    }
    
    // 按分类筛选 / Filter by category
    if (state.activeCategory !== 'all') {
      results = results.filter(b => (b.folder || '未分类') === state.activeCategory);
    }
    
    state.filteredBookmarks = results.slice(0, 50);
    state.selectedIndex = 0;
    updateCategoryBar();
    renderResults(state.filteredBookmarks);
  }

  /**
   * 更新分类标签栏
   * Update category tabs bar
   */
  function updateCategoryBar() {
    const bar = shadowRoot.getElementById('linkplus-category-bar');
    if (!bar) return;
    
    // 收集所有分类 / Collect all categories
    const categoryMap = {};
    state.bookmarks.forEach(b => {
      const cat = b.folder && b.folder !== 'QuickLink_Data' ? b.folder : '未分类';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    
    const categories = Object.keys(categoryMap).sort();
    const totalCount = state.bookmarks.length;
    
    // 如果只有一个分类，隐藏标签栏 / Hide bar if only one category
    if (categories.length <= 1) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'flex';
    
    bar.innerHTML = [
      `<button class="linkplus-category-tab${state.activeCategory === 'all' ? ' active' : ''}" data-category="all">全部 <span class="linkplus-category-count">${totalCount}</span></button>`,
      ...categories.map(cat => {
        const isActive = state.activeCategory === cat;
        return `<button class="linkplus-category-tab${isActive ? ' active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)} <span class="linkplus-category-count">${categoryMap[cat]}</span></button>`;
      })
    ].join('');
    
    // 绑定点击事件 / Bind click events
    bar.querySelectorAll('.linkplus-category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        state.activeCategory = tab.dataset.category;
        performSearch(state.searchQuery);
      });
    });
  }

  /**
   * 渲染搜索结果
   * Render search results
   * @param {Array} bookmarks - 书签数组 / Bookmarks array
   */
  function renderResults(bookmarks) {
    const resultsContainer = shadowRoot.getElementById('linkplus-results');
    
    if (bookmarks.length === 0) {
      if (state.isCommandMode) {
        resultsContainer.innerHTML = `
          <div class="linkplus-empty">
            <div class="linkplus-empty-icon">✨</div>
            <div>按 Enter 保存当前页面</div>
          </div>
        `;
      } else if (state.searchQuery) {
        resultsContainer.innerHTML = `
          <div class="linkplus-empty">
            <div class="linkplus-empty-icon">🔍</div>
            <div>未找到匹配的书签</div>
          </div>
        `;
      } else {
        resultsContainer.innerHTML = `
          <div class="linkplus-empty">
            <div class="linkplus-empty-icon">📚</div>
            <div>开始输入以搜索书签</div>
          </div>
        `;
      }
      return;
    }

    resultsContainer.innerHTML = bookmarks.map((bookmark, index) => `
      <div class="linkplus-result-item ${index === state.selectedIndex ? 'selected' : ''}" 
           data-index="${index}" 
           data-url="${bookmark.url}"
           data-id="${bookmark.id}">
        <div class="linkplus-result-icon">🔖</div>
        <div class="linkplus-result-content">
          <div class="linkplus-result-title">${escapeHtml(bookmark.title)}</div>
          <div class="linkplus-result-url">${escapeHtml(bookmark.url)}</div>
        </div>
        ${bookmark.folder && bookmark.folder !== 'QuickLink_Data' ? 
          `<span class="linkplus-result-folder">${escapeHtml(bookmark.folder)}</span>` : ''}
        <button class="linkplus-edit-btn" data-id="${bookmark.id}" title="编辑书签">
          <svg class="linkplus-icon" viewBox="0 0 1024 1024" fill="currentColor">
            <path d="M783.673469 929.959184H177.632653c-45.97551 0-83.591837-37.616327-83.591837-83.591837V240.326531c0-45.97551 37.616327-83.591837 83.591837-83.591837h407.510204c11.493878 0 20.897959 9.404082 20.897959 20.897959s-9.404082 20.897959-20.897959 20.897959H177.632653c-22.987755 0-41.795918 18.808163-41.795918 41.795919v606.040816c0 22.987755 18.808163 41.795918 41.795918 41.795918h606.040816c22.987755 0 41.795918-18.808163 41.795919-41.795918V438.857143c0-11.493878 9.404082-20.897959 20.897959-20.897959s20.897959 9.404082 20.897959 20.897959v407.510204c0 45.97551-37.616327 83.591837-83.591837 83.591837z"></path>
            <path d="M498.938776 563.722449c-9.926531 0-19.330612-4.179592-27.167347-11.493878-11.493878-11.493878-14.628571-28.212245-7.836735-42.840816l31.346939-66.873469c9.926531-21.420408 23.510204-40.75102 39.706122-56.946939l272.718367-272.718367c26.644898-26.644898 72.097959-25.6 100.310205 3.134693 28.734694 28.734694 29.779592 73.665306 3.134693 100.310205l-272.718367 272.718367c-16.718367 16.718367-35.526531 29.779592-56.946939 39.706122l-66.873469 31.346939c-5.22449 2.612245-10.44898 3.657143-15.673469 3.657143zM854.726531 135.836735c-6.791837 0-13.061224 2.612245-17.763266 7.314285L564.244898 415.346939c-13.061224 13.061224-23.510204 28.212245-31.346939 44.930612l-27.167347 57.469388 57.469388-27.167347c16.718367-7.836735 31.869388-18.285714 44.930612-31.346939l272.718368-272.718367c4.702041-4.702041 7.314286-11.493878 6.791836-19.330613-0.522449-8.359184-4.179592-16.195918-9.92653-21.942857-6.269388-6.269388-14.106122-9.926531-21.942857-9.92653-0.522449 0.522449-0.522449 0.522449-1.044898 0.522449z"></path>
            <path d="M621.714286 497.371429c-5.22449 0-10.44898-2.089796-14.628572-6.269388L532.897959 417.436735c-8.359184-8.359184-8.359184-21.420408 0-29.779592 8.359184-8.359184 21.420408-8.359184 29.779592 0l73.665306 73.665306c8.359184 8.359184 8.359184 21.420408 0 29.779592-4.179592 4.179592-9.404082 6.269388-14.628571 6.269388z"></path>
          </svg>
        </button>
        <button class="linkplus-delete-btn" data-id="${bookmark.id}" title="删除书签">
          <svg class="linkplus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    `).join('');

    // 绑定点击事件 / Bind click events
    resultsContainer.querySelectorAll('.linkplus-result-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // 如果点击的是编辑或删除按钮，不打开书签 / Don't open if edit or delete button clicked
        if (e.target.classList.contains('linkplus-edit-btn') || 
            e.target.classList.contains('linkplus-delete-btn')) {
          return;
        }
        const url = item.dataset.url;
        openBookmark(url, false);
      });
    });
    
    // 绑定编辑按钮事件 / Bind edit button events
    resultsContainer.querySelectorAll('.linkplus-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookmarkId = btn.dataset.id;
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
          handleEditBookmark(bookmarkId, bookmark.title);
        }
      });
    });
    
    // 绑定删除按钮事件 / Bind delete button events
    resultsContainer.querySelectorAll('.linkplus-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const bookmarkId = btn.dataset.id;
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
          handleDeleteBookmark(bookmarkId, bookmark.title);
        }
      });
    });
  }

  /**
   * 更新搜索图标
   * Update search icon
   */
  function updateSearchIcon() {
    const icon = shadowRoot.getElementById('linkplus-search-icon');
    if (state.isCommandMode) {
      icon.classList.add('command-mode');
      icon.innerHTML = `
        <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    } else {
      icon.classList.remove('command-mode');
      icon.innerHTML = `
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      `;
    }
  }

  /**
   * 更新指令提示
   * Update command hint
   */
  function updateCommandHint() {
    const hint = shadowRoot.getElementById('linkplus-command-hint');
    if (state.isCommandMode) {
      hint.classList.add('active');
      let hintText = '';
      if (state.commandTitle) {
        hintText += `标题: "${state.commandTitle}" `;
      }
      if (state.commandTag) {
        hintText += `→ 文件夹: "${state.commandTag}"`;
      }
      hint.textContent = hintText || '按 Enter 保存当前页面，输入标题 #标签 自定义';
    } else {
      hint.classList.remove('active');
    }
  }

  // ============================================
  // 键盘事件处理 / Keyboard Event Handling
  // ============================================

  /**
   * 处理键盘按下
   * Handle keydown
   * @param {KeyboardEvent} e - 键盘事件 / Keyboard event
   */
  function handleKeyDown(e) {
    if (!state.isSearchOpen) return;

    switch (e.key) {
      case 'Escape':
        closeSearchPanel();
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        navigateResults(1);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        navigateResults(-1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (state.isCommandMode) {
          executeCommand();
        } else {
          const newTab = e.metaKey || e.ctrlKey;
          selectBookmark(newTab);
        }
        break;
    }
  }

  /**
   * 导航搜索结果
   * Navigate search results
   * @param {number} direction - 方向（1 或 -1）/ Direction (1 or -1)
   */
  function navigateResults(direction) {
    if (state.filteredBookmarks.length === 0) return;
    
    state.selectedIndex += direction;
    
    // 边界检查 / Boundary check
    if (state.selectedIndex < 0) {
      state.selectedIndex = state.filteredBookmarks.length - 1;
    } else if (state.selectedIndex >= state.filteredBookmarks.length) {
      state.selectedIndex = 0;
    }
    
    renderResults(state.filteredBookmarks);
    scrollToSelected();
  }

  /**
   * 滚动到选中项
   * Scroll to selected item
   */
  function scrollToSelected() {
    const resultsContainer = shadowRoot.getElementById('linkplus-results');
    const selectedItem = resultsContainer.querySelector('.linkplus-result-item.selected');
    
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  /**
   * 选择书签
   * Select bookmark
   * @param {boolean} newTab - 是否在新标签页打开 / Open in new tab
   */
  function selectBookmark(newTab = false) {
    if (state.filteredBookmarks.length === 0) return;
    
    const bookmark = state.filteredBookmarks[state.selectedIndex];
    openBookmark(bookmark.url, newTab);
  }

  /**
   * 打开书签
   * Open bookmark
   * @param {string} url - 书签 URL / Bookmark URL
   * @param {boolean} newTab - 是否在新标签页打开 / Open in new tab
   */
  async function openBookmark(url, newTab) {
    try {
      await chrome.runtime.sendMessage({
        action: 'open-bookmark',
        url: url,
        newTab: newTab
      });
      closeSearchPanel();
    } catch (error) {
      console.error('[Link+] Failed to open bookmark:', error);
    }
  }

  /**
   * 执行指令
   * Execute command
   */
  async function executeCommand() {
    const input = shadowRoot.getElementById('linkplus-input');
    
    // 使用 document 获取当前页面信息 / Get current page info from document
    let title = state.commandTitle || document.title;
    let url = window.location.href;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'save-bookmark',
        title: title,
        url: url,
        tag: state.commandTag
      });
      
      if (response.success) {
        const message = state.commandTag 
          ? `已保存到"${state.commandTag}"` 
          : '已保存到"未分类"';
        showToast(message, 'success');
        closeSearchPanel();
        // 刷新书签列表 / Refresh bookmarks list
        loadBookmarks();
      } else if (response.error === 'duplicate') {
        // URL 已存在 / URL already exists
        showToast(response.message, 'error');
      } else {
        showToast('保存失败：' + (response.message || '请重试'), 'error');
      }
    } catch (error) {
      console.error('[Link+] Failed to save bookmark:', error);
      showToast('保存失败，请重试', 'error');
    }
  }

  // ============================================
  // 打开教程 / Open Tutorial
  // ============================================

  /**
   * 处理打开教程
   * Handle open tutorial
   */
  function handleOpenTutorial() {
    // 创建教程弹窗 / Create tutorial modal
    const modal = document.createElement('div');
    modal.className = 'linkplus-tutorial-modal';
    modal.innerHTML = `
      <div class="linkplus-tutorial-overlay">
        <div class="linkplus-tutorial-content">
          <div class="linkplus-tutorial-header">
            <h2>📚 Link+ 使用教程</h2>
            <button class="linkplus-tutorial-close">✕</button>
          </div>
          <div class="linkplus-tutorial-body">
            <section>
              <h3>⌨️ 快捷键</h3>
              <ul>
                <li><kbd>Alt + Q</kbd> 打开/关闭搜索框</li>
                <li><kbd>Alt + W</kbd> 快速保存当前页面</li>
              </ul>
            </section>
            
            <section>
              <h3>🔍 搜索书签</h3>
              <ol>
                <li>按 <kbd>Alt + Q</kbd> 打开搜索框</li>
                <li>输入关键词搜索已保存的书签</li>
                <li>使用 <kbd>↑↓</kbd> 键选择，<kbd>Enter</kbd> 打开</li>
                <li><kbd>Ctrl/Cmd + Enter</kbd> 在新标签页打开</li>
              </ol>
            </section>
            
            <section>
              <h3>💾 保存书签</h3>
              <div class="linkplus-tutorial-method">
                <h4>方法1：快速保存</h4>
                <p>按 <kbd>Alt + W</kbd> 直接保存到"未分类"</p>
              </div>
              
              <div class="linkplus-tutorial-method">
                <h4>方法2：命令模式保存（支持自定义名称和标签）</h4>
                <ol>
                  <li>按 <kbd>Alt + Q</kbd> 打开搜索框</li>
                  <li>输入格式：<code>+ 自定义标题 #标签</code></li>
                  <li>按 <kbd>Enter</kbd> 保存</li>
                </ol>
                
                <div class="linkplus-tutorial-examples">
                  <p><strong>示例：</strong></p>
                  <ul>
                    <li><code>+ 我的常用文档 #工作</code> → 保存为"我的常用文档"，归类到"工作"文件夹</li>
                    <li><code>+ Vue3 教程 #学习</code> → 保存为"Vue3 教程"，归类到"学习"文件夹</li>
                    <li><code>+ 待阅读文章</code> → 保存为"待阅读文章"，归类到"未分类"</li>
                    <li><code>+</code> → 使用网页默认标题，保存到"未分类"</li>
                  </ul>
                </div>
                
                <div class="linkplus-tutorial-tips">
                  <p><strong>说明：</strong></p>
                  <ul>
                    <li>自定义标题会替代网页原标题</li>
                    <li><code>#标签</code> 可放在任意位置</li>
                    <li>支持多个标签（取第一个）</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h3>🛠️ 管理书签</h3>
              <ul>
                <li>鼠标悬停书签项，点击 ✏️ 编辑名称</li>
                <li>鼠标悬停书签项，点击 🗑️ 删除</li>
                <li>点击底部"清空"按钮删除所有书签</li>
                <li>点击"设置"按钮修改快捷键</li>
              </ul>
            </section>
            
            <section>
              <h3>🖱️ 右键菜单</h3>
              <ul>
                <li>在任意网页右键，选择"✨ 一键存入 QuickLink"</li>
                <li>可选择保存到"未分类"、"工作"、"学习"或"稍后阅读"</li>
              </ul>
            </section>
            
            <section>
              <h3>💡 提示</h3>
              <ul>
                <li>相同 URL 只能保存一次</li>
                <li>所有书签保存在浏览器的"QuickLink_Data"文件夹中</li>
                <li>按 <kbd>ESC</kbd> 键可关闭搜索框</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    `;
    
    shadowRoot.appendChild(modal);
    
    // 绑定关闭事件 / Bind close event
    const closeBtn = modal.querySelector('.linkplus-tutorial-close');
    const overlay = modal.querySelector('.linkplus-tutorial-overlay');
    
    const closeModal = () => {
      modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal();
      }
    });
    
    // ESC 键关闭 / Close on ESC
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }

  // ============================================
  // 打开设置 / Open Settings
  // ============================================

  /**
   * 处理打开设置页面
   * Handle open settings page
   */
  async function handleOpenSettings() {
    try {
      // 通过 background script 打开设置页面 / Open settings page via background script
      await chrome.runtime.sendMessage({ action: 'open-settings' });
      showToast('请在打开的页面中设置快捷键', 'success');
    } catch (error) {
      console.error('[Link+] Failed to open settings:', error);
      showToast('无法打开设置页面', 'error');
    }
  }

  // ============================================
  // 编辑书签 / Edit Bookmark
  // ============================================

  /**
   * 处理编辑书签
   * Handle edit bookmark
   * @param {string} bookmarkId - 书签 ID / Bookmark ID
   * @param {string} currentTitle - 当前标题 / Current title
   */
  async function handleEditBookmark(bookmarkId, currentTitle) {
    // 弹出输入框让用户输入新名称 / Prompt user for new name
    const newTitle = prompt('请输入新的书签名称：', currentTitle);
    
    // 用户取消或没有输入 / User cancelled or empty input
    if (!newTitle || newTitle.trim() === '') {
      return;
    }
    
    // 名称没有变化 / Title not changed
    if (newTitle.trim() === currentTitle) {
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'update-bookmark',
        bookmarkId: bookmarkId,
        title: newTitle.trim()
      });
      
      if (response.success) {
        showToast('书签已更新', 'success');
        // 刷新书签列表 / Refresh bookmarks list
        await loadBookmarks();
        performSearch(state.searchQuery);
      } else {
        showToast('更新失败：' + response.error, 'error');
      }
    } catch (error) {
      console.error('[Link+] Failed to update bookmark:', error);
      showToast('更新失败，请重试', 'error');
    }
  }

  // ============================================
  // 删除单个书签 / Delete Single Bookmark
  // ============================================

  /**
   * 处理删除单个书签
   * Handle delete single bookmark
   * @param {string} bookmarkId - 书签 ID / Bookmark ID
   * @param {string} bookmarkTitle - 书签标题 / Bookmark title
   */
  async function handleDeleteBookmark(bookmarkId, bookmarkTitle) {
    // 确认对话框 / Confirmation dialog
    const confirmed = confirm(`确定要删除书签"${bookmarkTitle}"吗？\n\n此操作无法撤销。`);
    
    if (!confirmed) {
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'delete-bookmark',
        bookmarkId: bookmarkId
      });
      
      if (response.success) {
        showToast('已删除书签', 'success');
        // 刷新书签列表 / Refresh bookmarks list
        await loadBookmarks();
        performSearch(state.searchQuery);
      } else {
        showToast('删除失败：' + response.error, 'error');
      }
    } catch (error) {
      console.error('[Link+] Failed to delete bookmark:', error);
      showToast('删除失败，请重试', 'error');
    }
  }

  // ============================================
  // 清空所有收藏 / Clear All Bookmarks
  // ============================================

  /**
   * 处理清空所有收藏
   * Handle clear all bookmarks
   */
  async function handleClearAll() {
    // 确认对话框 / Confirmation dialog
    const confirmed = confirm('⚠️ 确定要清空所有收藏吗？\n\n此操作将删除 QuickLink_Data 文件夹中的所有书签，无法撤销。');
    
    if (!confirmed) {
      return;
    }
    
    try {
      // 发送消息给 background 清空所有书签 / Send message to background to clear all
      const response = await chrome.runtime.sendMessage({
        action: 'clear-all-bookmarks'
      });
      
      if (response.success) {
        showToast(`已清空 ${response.count} 个收藏`, 'success');
        // 刷新书签列表 / Refresh bookmarks list
        await loadBookmarks();
        performSearch('');
      } else {
        showToast('清空失败：' + response.error, 'error');
      }
    } catch (error) {
      console.error('[Link+] Failed to clear bookmarks:', error);
      showToast('清空失败，请重试', 'error');
    }
  }

  // ============================================
  // 面板控制 / Panel Control
  // ============================================

  /**
   * 打开搜索面板
   * Open search panel
   */
  async function openSearchPanel() {
    if (state.isSearchOpen) return;
    
    // 确保 Shadow DOM 已初始化 / Ensure Shadow DOM is initialized
    initShadowDOM();
    
    // 创建 UI / Create UI if not exists
    if (!shadowRoot.getElementById('linkplus-overlay')) {
      createSearchPanel();
      createToastContainer();
      await loadBookmarks();
    }
    
    const overlay = shadowRoot.getElementById('linkplus-overlay');
    const input = shadowRoot.getElementById('linkplus-input');
    
    state.isSearchOpen = true;
    state.searchQuery = '';
    state.selectedIndex = 0;
    state.isCommandMode = false;
    state.commandTag = null;
    state.commandTitle = null;
    state.activeCategory = 'all'; // 重置分类 / Reset category
    
    overlay.classList.add('active');
    input.value = '';
    
    // 延迟聚焦以确保动画完成后输入框可获得焦点 / Delay focus to ensure input can be focused after animation
    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);
    
    // 刷新书签数据 / Refresh bookmarks
    await loadBookmarks();
    performSearch('');
  }

  /**
   * 关闭搜索面板
   * Close search panel
   */
  function closeSearchPanel() {
    if (!state.isSearchOpen) return;
    
    const overlay = shadowRoot.getElementById('linkplus-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    
    state.isSearchOpen = false;
  }

  /**
   * 切换搜索面板
   * Toggle search panel
   */
  function toggleSearchPanel() {
    if (state.isSearchOpen) {
      closeSearchPanel();
    } else {
      openSearchPanel();
    }
  }

  // ============================================
  // Toast 通知 / Toast Notification
  // ============================================

  /**
   * 显示 Toast 通知
   * Show toast notification
   * @param {string} message - 消息内容 / Message content
   * @param {string} type - 类型（success 或 error）/ Type (success or error)
   * @param {number} duration - 显示时长（毫秒）/ Display duration (ms)
   */
  function showToast(message, type = 'success', duration = 2000) {
    // 确保 Shadow DOM 已初始化 / Ensure Shadow DOM is initialized
    initShadowDOM();
    
    // 创建 Toast 容器（如果不存在）/ Create toast container if not exists
    if (!shadowRoot.getElementById('linkplus-toast-container')) {
      createToastContainer();
    }
    
    const container = shadowRoot.getElementById('linkplus-toast-container');
    
    const toast = document.createElement('div');
    toast.className = `linkplus-toast ${type}`;
    
    const iconSvg = type === 'success' 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>';
    
    toast.innerHTML = `
      <div class="linkplus-toast-icon">${iconSvg}</div>
      <div class="linkplus-toast-message">${escapeHtml(message)}</div>
    `;
    
    container.appendChild(toast);
    
    // 触发动画 / Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // 自动移除 / Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  // ============================================
  // 工具函数 / Utility Functions
  // ============================================

  /**
   * HTML 转义
   * HTML escape
   * @param {string} text - 原始文本 / Raw text
   * @returns {string} 转义后的文本 / Escaped text
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // 消息监听 / Message Listeners
  // ============================================

  /**
   * 监听来自 background 的消息
   * Listen for messages from background
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Link+] Content script received message:', request.action);
    
    switch (request.action) {
      case 'toggle-search':
        toggleSearchPanel();
        sendResponse({ success: true });
        break;
        
      case 'show-toast':
        showToast(request.message, request.type || 'success');
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
    
    return true;
  });

  // ============================================
  // 初始化 / Initialization
  // ============================================

  /**
   * 页面加载完成后初始化
   * Initialize when page is loaded
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShadowDOM);
  } else {
    initShadowDOM();
  }

  console.log('[Link+] Content script loaded');

})();
