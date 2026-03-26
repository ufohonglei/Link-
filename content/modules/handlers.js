/**
 * Link+ handlers.js
 * 书签操作处理：保存、编辑、删除、清空、设置 / Bookmark action handlers
 */

/* global LinkPlus */

/**
 * 执行保存指令（命令模式 Enter）
 */
LinkPlus.executeCommand = async function() {
  const { showToast, closeSearchPanel, loadBookmarks } = LinkPlus;
  const state = LinkPlus.state;
  
  // 1. 优先级：指令显式指定的#标签 > 搜索栏当前选中的分类Tab > 未分类
  let finalTag = state.commandTag;
  if (!finalTag && state.activeCategory && state.activeCategory !== 'all') {
    finalTag = state.activeCategory;
  }
  
  const title = state.commandTitle || document.title;
  const url = window.location.href;

  // 记录日志并检查是否为限制页面
  console.log('[Link+] ExecuteCommand Save:', { title, finalTag, activeCat: state.activeCategory });

  if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('edge://')) {
    showToast('空白页或系统页无法存入书签', 'error');
    return;
  }

  try {
    const res = await chrome.runtime.sendMessage({
      action: 'save-bookmark', 
      title, 
      url, 
      tag: (finalTag === '未分类' ? null : finalTag),
    });

    const displayTag = finalTag || '未分类';

    if (res.success) {
      showToast(`已保存到"${displayTag}"`, 'success');
      // 先刷新本地列表
      await loadBookmarks();
      // 云同步（异步，不阻塞）
      if (LinkPlus.state.isLoggedIn) {
        LinkPlus.syncCreateBookmark(title, url, displayTag).catch(e => console.log('[Link+] Cloud sync skipped:', e));
      }
      
      // 不再关闭面板，而是清空输入框并刷新显示
      const input = LinkPlus.shadowRoot.getElementById('linkplus-input');
      if (input) {
        input.value = '';
        state.searchQuery = '';
        state.isCommandMode = false;
        if (typeof LinkPlus.updateSearchIcon === 'function') LinkPlus.updateSearchIcon();
        if (typeof LinkPlus.updateCommandHint === 'function') LinkPlus.updateCommandHint();
      }
      LinkPlus.performSearch('');
    } else if (res.error === 'duplicate') {
      showToast(res.message, 'error');
    } else {
      showToast('保存失败：' + (res.message || '请重试'), 'error');
    }
  } catch (e) {
    console.error('[Link+] Failed to save bookmark:', e);
    showToast('保存失败，请重试', 'error');
  }
};

/**
 * 编辑书签（标题和分类）
 */
LinkPlus.handleEditBookmark = async function(bookmarkId, currentTitle, currentCategory) {
  // 获取当前书签的完整信息
  const bm = LinkPlus.state.bookmarks.find(b => b.id === bookmarkId);
  const folder = currentCategory || (bm ? bm.folder : '未分类');
  
  // 获取所有现有分类
  const categories = [...new Set(LinkPlus.state.bookmarks.map(b => b.folder).filter(f => f && f !== 'QuickLink_Data'))];
  if (!categories.includes('未分类')) categories.unshift('未分类');
  
  // 生成分类选项
  const categoryOptions = categories.map(cat => 
    `<option value="${LinkPlus.escapeHtml(cat)}" ${cat === folder ? 'selected' : ''}>${LinkPlus.escapeHtml(cat)}</option>`
  ).join('');

  // 创建自定义编辑弹窗（使用内联样式确保正确显示）
  const modal = document.createElement('div');
  modal.className = 'linkplus-edit-modal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;';
  modal.innerHTML = `
    <div class="linkplus-edit-overlay" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;">
      <div class="linkplus-edit-content" style="width:420px;max-width:90vw;background:rgba(30,30,35,0.98);border:1px solid rgba(255,255,255,0.1);border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);display:flex;flex-direction:column;">
        <div class="linkplus-edit-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <h3 style="color:#fff;font-size:16px;font-weight:600;margin:0;">✏️ 编辑书签</h3>
          <button class="linkplus-edit-close" title="关闭" style="background:transparent;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;padding:4px 8px;border-radius:4px;transition:all 0.15s ease;">✕</button>
        </div>
        <div class="linkplus-edit-body" style="padding:20px;display:flex;flex-direction:column;gap:16px;">
          <div class="linkplus-edit-field" style="display:flex;flex-direction:column;gap:6px;">
            <label for="linkplus-edit-title" style="color:rgba(255,255,255,0.7);font-size:13px;font-weight:500;">书签名称</label>
            <input type="text" id="linkplus-edit-title" value="${LinkPlus.escapeHtml(currentTitle)}" placeholder="输入书签名称..." autocomplete="off" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;outline:none;">
          </div>
          <div class="linkplus-edit-field" style="display:flex;flex-direction:column;gap:6px;">
            <label for="linkplus-edit-category" style="color:rgba(255,255,255,0.7);font-size:13px;font-weight:500;">分类</label>
            <select id="linkplus-edit-category" style="background:#2a2a2e;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;outline:none;cursor:pointer;">
              ${categoryOptions}
              <option value="__new__">+ 新建分类...</option>
            </select>
            <input type="text" id="linkplus-edit-category-new" placeholder="输入新分类名称..." style="display:none;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 12px;color:#fff;font-size:14px;outline:none;margin-top:8px;">
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 20px;border-top:1px solid rgba(255,255,255,0.08);flex-shrink:0;">
          <button class="linkplus-edit-cancel" style="padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.6);">取消</button>
          <button class="linkplus-edit-save" style="padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none;background:#6366f1;color:#fff;">保存</button>
        </div>
      </div>
    </div>
  `;

  // 将编辑弹窗添加到 Shadow DOM 内部（和搜索面板在一起）
  const container = LinkPlus.shadowRoot.getElementById('linkplus-container');
  if (container) {
    container.appendChild(modal);
  } else {
    LinkPlus.shadowRoot.appendChild(modal);
  }

  // 获取元素引用
  const titleInput = modal.querySelector('#linkplus-edit-title');
  const categorySelect = modal.querySelector('#linkplus-edit-category');
  const categoryNewInput = modal.querySelector('#linkplus-edit-category-new');
  const closeBtn = modal.querySelector('.linkplus-edit-close');
  const cancelBtn = modal.querySelector('.linkplus-edit-cancel');
  const saveBtn = modal.querySelector('.linkplus-edit-save');

  // 分类下拉选择事件
  categorySelect.addEventListener('change', () => {
    if (categorySelect.value === '__new__') {
      categoryNewInput.style.display = 'block';
      categoryNewInput.focus();
    } else {
      categoryNewInput.style.display = 'none';
    }
  });

  // 关闭弹窗函数
  const closeModal = () => {
    modal.remove();
    // 移除全局 ESC 事件监听
    document.removeEventListener('keydown', onEsc);
  };

  // 绑定关闭事件
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modal.querySelector('.linkplus-edit-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // ESC 关闭
  const onEsc = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };
  document.addEventListener('keydown', onEsc);

  // 聚焦到标题输入框
  setTimeout(() => titleInput.focus(), 0);

  // 保存处理
  saveBtn.addEventListener('click', async () => {
    const newTitle = titleInput.value.trim();
    // 获取分类：如果是新建分类则使用输入框的值，否则使用下拉选择的值
    let newCategory = categorySelect.value === '__new__' 
      ? categoryNewInput.value.trim() 
      : categorySelect.value;

    if (!newTitle) {
      LinkPlus.showToast('书签名称不能为空', 'error');
      return;
    }

    const titleChanged = newTitle !== currentTitle;
    const categoryChanged = newCategory !== folder && newCategory !== (folder === '未分类' ? '' : folder);

    if (!titleChanged && !categoryChanged) {
      closeModal();
      return;
    }

    try {
      const res = await chrome.runtime.sendMessage({
        action: 'update-bookmark',
        bookmarkId,
        title: titleChanged ? newTitle : undefined,
        category: categoryChanged ? newCategory : undefined
      });

      if (res.success) {
        LinkPlus.showToast('书签已更新', 'success');
        closeModal();

        // 云同步（如果已登录）
        if (LinkPlus.state.isLoggedIn && bm) {
          const updateData = {};
          if (titleChanged) updateData.title = newTitle;
          if (categoryChanged) updateData.category = newCategory || '未分类';
          LinkPlus.syncUpdateBookmarkByUrl(bm.url, updateData);
        }

        await LinkPlus.loadBookmarks();
        LinkPlus.performSearch(LinkPlus.state.searchQuery);
      } else {
        LinkPlus.showToast('更新失败：' + res.error, 'error');
      }
    } catch (e) {
      console.error('[Link+] Failed to update bookmark:', e);
      LinkPlus.showToast('更新失败，请重试', 'error');
    }
  });

  // Enter 键保存
  titleInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveBtn.click();
    }
  });
  // 如果当前是新建分类输入框，也支持 Enter 保存
  if (categoryNewInput) {
    categoryNewInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveBtn.click();
      }
    });
  }
};

/**
 * 删除单个书签
 */
LinkPlus.handleDeleteBookmark = async function(bookmarkId, bookmarkTitle) {
  if (!confirm(`确定要删除书签"${bookmarkTitle}"吗？\n\n此操作无法撤销。`)) return;

  // 先找到书签信息
  const bm = LinkPlus.state.bookmarks.find(b => b.id === bookmarkId);

  try {
    // 1. 先删除本地书签
    const res = await chrome.runtime.sendMessage({
      action: 'delete-bookmark', bookmarkId,
    });
    
    if (res.success) {
      LinkPlus.showToast('已删除书签', 'success');
      
      // 2. 如果已登录，同步删除服务器上的书签（通过 URL 查找）
      if (LinkPlus.state.isLoggedIn && bm) {
        LinkPlus.syncDeleteBookmarkByUrl(bm.url).catch(e => 
          console.log('[Link+] Server delete sync skipped:', e)
        );
      }
      
      await LinkPlus.loadBookmarks();
      LinkPlus.performSearch(LinkPlus.state.searchQuery);
    } else {
      LinkPlus.showToast('删除失败：' + res.error, 'error');
    }
  } catch (e) {
    console.error('[Link+] Failed to delete bookmark:', e);
    LinkPlus.showToast('删除失败，请重试', 'error');
  }
};

/**
 * 清空所有收藏
 */
LinkPlus.handleClearAll = async function() {
  if (!confirm('⚠️ 确定要清空所有收藏吗？\n\n此操作将删除所有书签，无法撤销。')) return;

  try {
    // 已登录时先清空云端
    if (LinkPlus.state.isLoggedIn) {
      const cloudRes = await LinkPlus.api.clearBookmarks();
      if (!cloudRes.success) {
        LinkPlus.showToast('云端清空失败：' + cloudRes.error, 'error');
        return;
      }
    }
    // 清空本地
    const res = await chrome.runtime.sendMessage({ action: 'clear-all-bookmarks' });
    if (res.success) {
      LinkPlus.showToast(`已清空 ${res.count} 个收藏`, 'success');
      await LinkPlus.loadBookmarks();
      LinkPlus.performSearch('');
    } else {
      LinkPlus.showToast('清空失败：' + res.error, 'error');
    }
  } catch (e) {
    console.error('[Link+] Failed to clear bookmarks:', e);
    LinkPlus.showToast('清空失败，请重试', 'error');
  }
};

/**
 * 打开快捷键设置页面
 */
LinkPlus.handleOpenSettings = async function() {
  try {
    await chrome.runtime.sendMessage({ action: 'open-settings' });
    LinkPlus.showToast('请在打开的页面中设置快捷键', 'success');
  } catch (e) {
    console.error('[Link+] Failed to open settings:', e);
    LinkPlus.showToast('无法打开设置页面', 'error');
  }
};
