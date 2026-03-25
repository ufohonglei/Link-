/**
 * Link+ ui.js
 * UI 渲染与面板创建 / UI rendering and panel creation
 */

/* global LinkPlus */

// ── SVG 图标常量 ──
const ICONS = {
  search: `<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>`,
  searchCmd: `<path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>`,
  tutorial: `<path d="M938.666667 379.733333c0-17.066667-8.533333-29.866667-25.6-38.4l-366.933334-162.133333c-21.333333-8.533333-46.933333-8.533333-68.266666 0L110.933333 345.6c-17.066667 8.533333-25.6 21.333333-25.6 38.4s8.533333 29.866667 25.6 38.4L213.333333 469.333333v213.333334c0 34.133333 17.066667 64 46.933334 76.8 4.266667 0 4.266667 4.266667 8.533333 4.266666l209.066667 85.333334c21.333333 8.533333 42.666667 8.533333 64 0l209.066666-85.333334c4.266667 0 8.533333-4.266667 8.533334-4.266666 29.866667-12.8 46.933333-42.666667 46.933333-76.8v-213.333334l42.666667-21.333333V597.333333c0 25.6 17.066667 42.666667 42.666666 42.666667s42.666667-17.066667 42.666667-42.666667l4.266667-217.6c0 4.266667 0 0 0 0zM725.333333 682.666667l-179.2 72.533333c-21.333333 8.533333-42.666667 8.533333-64 0L298.666667 682.666667v-174.933334l179.2 81.066667c21.333333 8.533333 46.933333 8.533333 68.266666 0l179.2-81.066667V682.666667z m-213.333333-174.933334L230.4 384 512 256l281.6 123.733333-281.6 128z"></path>`,
  settings: `<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>`,
  trash: `<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>`,
  edit: `<path d="M783.673469 929.959184H177.632653c-45.97551 0-83.591837-37.616327-83.591837-83.591837V240.326531c0-45.97551 37.616327-83.591837 83.591837-83.591837h407.510204c11.493878 0 20.897959 9.404082 20.897959 20.897959s-9.404082 20.897959-20.897959 20.897959H177.632653c-22.987755 0-41.795918 18.808163-41.795918 41.795919v606.040816c0 22.987755 18.808163 41.795918 41.795918 41.795918h606.040816c22.987755 0 41.795918-18.808163 41.795919-41.795918V438.857143c0-11.493878 9.404082-20.897959 20.897959-20.897959s20.897959 9.404082 20.897959 20.897959v407.510204c0 45.97551-37.616327 83.591837-83.591837 83.591837z"></path><path d="M498.938776 563.722449c-9.926531 0-19.330612-4.179592-27.167347-11.493878-11.493878-11.493878-14.628571-28.212245-7.836735-42.840816l31.346939-66.873469c9.926531-21.420408 23.510204-40.75102 39.706122-56.946939l272.718367-272.718367c26.644898-26.644898 72.097959-25.6 100.310205 3.134693 28.734694 28.734694 29.779592 73.665306 3.134693 100.310205l-272.718367 272.718367c-16.718367 16.718367-35.526531 29.779592-56.946939 39.706122l-66.873469 31.346939c-5.22449 2.612245-10.44898 3.657143-15.673469 3.657143z"></path><path d="M621.714286 497.371429c-5.22449 0-10.44898-2.089796-14.628572-6.269388L532.897959 417.436735c-8.359184-8.359184-8.359184-21.420408 0-29.779592 8.359184-8.359184 21.420408-8.359184 29.779592 0l73.665306 73.665306c8.359184 8.359184 8.359184 21.420408 0 29.779592-4.179592 4.179592-9.404082 6.269388-14.628571 6.269388z"></path>`,
};

/**
 * 创建搜索面板
 */
LinkPlus.createSearchPanel = function() {
  const { shadowRoot, closeSearchPanel, handleInput, handleKeyDown,
    handleOpenTutorial, handleOpenSettings, handleClearAll } = LinkPlus;

  const container = shadowRoot.getElementById('linkplus-container');

  // 遮罩层
  const overlay = document.createElement('div');
  overlay.className = 'linkplus-overlay';
  overlay.id = 'linkplus-overlay';
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearchPanel(); });

  // 面板
  const panel = document.createElement('div');
  panel.className = 'linkplus-panel';

  // 搜索框
  const searchBox = document.createElement('div');
  searchBox.className = 'linkplus-search-box';
  searchBox.innerHTML = `
    <svg class="linkplus-search-icon" id="linkplus-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${ICONS.search}
    </svg>
    <input type="text" class="linkplus-input" id="linkplus-input" placeholder="搜索书签..." autocomplete="off">
    <span class="linkplus-shortcut-hint">ESC 关闭</span>
  `;

  // 指令提示
  const commandHint = document.createElement('div');
  commandHint.className = 'linkplus-command-hint';
  commandHint.id = 'linkplus-command-hint';
  commandHint.textContent = '按 Enter 保存当前页面，使用 #标签 自动归类';

  // 分类标签栏
  const categoryBar = document.createElement('div');
  categoryBar.className = 'linkplus-category-bar';
  categoryBar.id = 'linkplus-category-bar';

  // 结果列表
  const results = document.createElement('div');
  results.className = 'linkplus-results';
  results.id = 'linkplus-results';

  // 底部栏
  const footer = document.createElement('div');
  footer.className = 'linkplus-footer';
  footer.innerHTML = `
    <div class="linkplus-footer-hint">
      <span class="linkplus-key">↑↓</span><span>导航</span>
    </div>
    <div class="linkplus-footer-actions">
      <button class="linkplus-footer-btn linkplus-footer-tutorial" id="linkplus-tutorial-btn" title="使用教程">
        <svg class="linkplus-icon" viewBox="0 0 1024 1024" fill="currentColor">${ICONS.tutorial}</svg>
        <span>教程</span>
      </button>
      <button class="linkplus-footer-btn linkplus-footer-settings" id="linkplus-settings-btn" title="设置快捷键">
        <svg class="linkplus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS.settings}</svg>
        <span>设置</span>
      </button>
      <button class="linkplus-footer-btn linkplus-footer-clear" id="linkplus-clear-btn" title="清空所有收藏">
        <svg class="linkplus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS.trash}</svg>
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

  // 绑定事件
  shadowRoot.getElementById('linkplus-input').addEventListener('input', handleInput);
  shadowRoot.getElementById('linkplus-input').addEventListener('keydown', handleKeyDown);
  shadowRoot.getElementById('linkplus-tutorial-btn').addEventListener('click', handleOpenTutorial);
  shadowRoot.getElementById('linkplus-settings-btn').addEventListener('click', handleOpenSettings);
  shadowRoot.getElementById('linkplus-clear-btn').addEventListener('click', handleClearAll);
};

/**
 * 创建 Toast 容器
 */
LinkPlus.createToastContainer = function() {
  const container = LinkPlus.shadowRoot.getElementById('linkplus-container');
  const toastContainer = document.createElement('div');
  toastContainer.className = 'linkplus-toast-container';
  toastContainer.id = 'linkplus-toast-container';
  container.appendChild(toastContainer);
};

/**
 * 渲染搜索结果
 */
LinkPlus.renderResults = function(bookmarks) {
  const { shadowRoot, state, openBookmark, handleEditBookmark, handleDeleteBookmark } = LinkPlus;
  const container = shadowRoot.getElementById('linkplus-results');

  if (bookmarks.length === 0) {
    const emptyMap = {
      command: ['✨', '按 Enter 保存当前页面'],
      search:  ['🔍', '未找到匹配的书签'],
      default: ['📚', '开始输入以搜索书签'],
    };
    const key = state.isCommandMode ? 'command' : (state.searchQuery ? 'search' : 'default');
    const [icon, text] = emptyMap[key];
    container.innerHTML = `<div class="linkplus-empty"><div class="linkplus-empty-icon">${icon}</div><div>${text}</div></div>`;
    return;
  }

  const escHtml = LinkPlus.escapeHtml;

  container.innerHTML = bookmarks.map((bm, i) => `
    <div class="linkplus-result-item ${i === state.selectedIndex ? 'selected' : ''}"
         data-index="${i}" data-url="${bm.url}" data-id="${bm.id}">
      <div class="linkplus-result-icon">🔖</div>
      <div class="linkplus-result-content">
        <div class="linkplus-result-title">${escHtml(bm.title)}</div>
        <div class="linkplus-result-url">${escHtml(bm.url)}</div>
      </div>
      ${bm.folder && bm.folder !== 'QuickLink_Data'
        ? `<span class="linkplus-result-folder">${escHtml(bm.folder)}</span>` : ''}
      <button class="linkplus-edit-btn" data-id="${bm.id}" title="编辑书签">
        <svg class="linkplus-icon" viewBox="0 0 1024 1024" fill="currentColor">${ICONS.edit}</svg>
      </button>
      <button class="linkplus-delete-btn" data-id="${bm.id}" title="删除书签">
        <svg class="linkplus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS.trash}</svg>
      </button>
    </div>
  `).join('');

  // 绑定事件
  container.querySelectorAll('.linkplus-result-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.linkplus-edit-btn') || e.target.closest('.linkplus-delete-btn')) return;
      openBookmark(item.dataset.url, false);
    });
  });
  container.querySelectorAll('.linkplus-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const bm = bookmarks.find(b => b.id === btn.dataset.id);
      if (bm) handleEditBookmark(bm.id, bm.title);
    });
  });
  container.querySelectorAll('.linkplus-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const bm = bookmarks.find(b => b.id === btn.dataset.id);
      if (bm) handleDeleteBookmark(bm.id, bm.title);
    });
  });
};

/**
 * 更新搜索图标（普通/指令模式）
 */
LinkPlus.updateSearchIcon = function() {
  const icon = LinkPlus.shadowRoot.getElementById('linkplus-search-icon');
  if (LinkPlus.state.isCommandMode) {
    icon.classList.add('command-mode');
    icon.innerHTML = ICONS.searchCmd;
  } else {
    icon.classList.remove('command-mode');
    icon.innerHTML = ICONS.search;
  }
};

/**
 * 更新指令提示文字
 */
LinkPlus.updateCommandHint = function() {
  const { state } = LinkPlus;
  const hint = LinkPlus.shadowRoot.getElementById('linkplus-command-hint');
  if (state.isCommandMode) {
    hint.classList.add('active');
    let text = '';
    if (state.commandTitle) text += `标题: "${state.commandTitle}" `;
    if (state.commandTag)   text += `→ 文件夹: "${state.commandTag}"`;
    hint.textContent = text || '按 Enter 保存当前页面，输入标题 #标签 自定义';
  } else {
    hint.classList.remove('active');
  }
};

/**
 * 显示教程弹窗
 */
LinkPlus.handleOpenTutorial = function() {
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
              <h4>方法2：命令模式（自定义名称和标签）</h4>
              <ol>
                <li>按 <kbd>Alt + Q</kbd> 打开搜索框</li>
                <li>输入格式：<code>+ 自定义标题 #标签</code></li>
                <li>按 <kbd>Enter</kbd> 保存</li>
              </ol>
              <div class="linkplus-tutorial-examples">
                <p><strong>示例：</strong></p>
                <ul>
                  <li><code>+ 我的常用文档 #工作</code> → 保存为"我的常用文档"，归类到"工作"</li>
                  <li><code>+ Vue3 教程 #学习</code> → 保存为"Vue3 教程"，归类到"学习"</li>
                  <li><code>+ 待阅读文章</code> → 保存到"未分类"</li>
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

  LinkPlus.shadowRoot.appendChild(modal);

  const closeModal = () => modal.remove();
  modal.querySelector('.linkplus-tutorial-close').addEventListener('click', closeModal);
  modal.querySelector('.linkplus-tutorial-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  const onEsc = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); } };
  document.addEventListener('keydown', onEsc);
};
