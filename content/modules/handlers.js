/**
 * Link+ handlers.js
 * 书签操作处理：保存、编辑、删除、清空、设置 / Bookmark action handlers
 */

/* global LinkPlus */

/**
 * 执行保存指令（命令模式 Enter）
 */
LinkPlus.executeCommand = async function() {
  const { state, showToast, closeSearchPanel, loadBookmarks, performSearch } = LinkPlus;
  const title = state.commandTitle || document.title;
  const url   = window.location.href;

  try {
    const res = await chrome.runtime.sendMessage({
      action: 'save-bookmark', title, url, tag: state.commandTag,
    });
    if (res.success) {
      showToast(state.commandTag ? `已保存到"${state.commandTag}"` : '已保存到"未分类"', 'success');
      closeSearchPanel();
      loadBookmarks();
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
 * 编辑书签名称
 */
LinkPlus.handleEditBookmark = async function(bookmarkId, currentTitle) {
  const newTitle = prompt('请输入新的书签名称：', currentTitle);
  if (!newTitle || !newTitle.trim() || newTitle.trim() === currentTitle) return;

  try {
    const res = await chrome.runtime.sendMessage({
      action: 'update-bookmark', bookmarkId, title: newTitle.trim(),
    });
    if (res.success) {
      LinkPlus.showToast('书签已更新', 'success');
      await LinkPlus.loadBookmarks();
      LinkPlus.performSearch(LinkPlus.state.searchQuery);
    } else {
      LinkPlus.showToast('更新失败：' + res.error, 'error');
    }
  } catch (e) {
    console.error('[Link+] Failed to update bookmark:', e);
    LinkPlus.showToast('更新失败，请重试', 'error');
  }
};

/**
 * 删除单个书签
 */
LinkPlus.handleDeleteBookmark = async function(bookmarkId, bookmarkTitle) {
  if (!confirm(`确定要删除书签"${bookmarkTitle}"吗？\n\n此操作无法撤销。`)) return;

  try {
    const res = await chrome.runtime.sendMessage({
      action: 'delete-bookmark', bookmarkId,
    });
    if (res.success) {
      LinkPlus.showToast('已删除书签', 'success');
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
  if (!confirm('⚠️ 确定要清空所有收藏吗？\n\n此操作将删除 QuickLink_Data 文件夹中的所有书签，无法撤销。')) return;

  try {
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
