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
  const title    = state.commandTitle || document.title;
  const url      = window.location.href;
  const category = state.commandTag || '未分类';

  try {
    const res = await chrome.runtime.sendMessage({
      action: 'save-bookmark', title, url, tag: state.commandTag,
    });
    if (res.success) {
      showToast(state.commandTag ? `已保存到"${state.commandTag}"` : '已保存到"未分类"', 'success');
      // 先刷新本地列表（在关闭面板之前，确保UI元素存在）
      await loadBookmarks();
      // 云同步（异步，不阻塞）
      if (LinkPlus.state.isLoggedIn) {
        LinkPlus.syncCreateBookmark(title, url, category).catch(e => console.log('[Link+] Cloud sync skipped:', e));
      }
      // 最后关闭面板
      closeSearchPanel();
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
      // 云同步（如果已登录，尝试同步到服务器）
      if (LinkPlus.state.isLoggedIn) {
        const bm = LinkPlus.state.bookmarks.find(b => b.id === bookmarkId);
        if (bm) {
          // 使用 URL 作为唯一标识同步到服务器
          LinkPlus.syncUpdateBookmarkByUrl(bm.url, { title: newTitle.trim() });
        }
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
