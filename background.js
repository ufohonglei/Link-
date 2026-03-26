/**
 * Link+ background.js - Service Worker 入口
 *
 * 加载顺序：
 *   background/bookmarks.js  - 书签增删改查 & 缓存
 *   background/messages.js   - content script 消息处理
 *   background.js            ← 本文件（快捷键、右键菜单、初始化）
 */

importScripts('background/bookmarks.js', 'background/messages.js');

// ── 右键菜单 ──
async function createContextMenus() {
  try {
    const folders = await getCategoryFolders();
    chrome.contextMenus.removeAll(() => {
      // 主菜单
      chrome.contextMenus.create({
        id: 'linkplus-main',
        title: '✨ 一键存入 Link+',
        contexts: ['page', 'link', 'selection'],
        documentUrlPatterns: ['<all_urls>']
      });

      // 默认分类
      chrome.contextMenus.create({
        id: 'linkplus-save-folder:uncategorized',
        parentId: 'linkplus-main',
        title: '📁 保存到"未分类"',
        contexts: ['page', 'link', 'selection']
      });

      // 动态分类
      folders.forEach((name) => {
        chrome.contextMenus.create({
          id: `linkplus-save-folder:${name}`,
          parentId: 'linkplus-main',
          title: `📁 保存到"${name}"`,
          contexts: ['page', 'link', 'selection']
        });
      });
    });
  } catch (e) {
    console.error('[Link+] Failed to create context menus:', e);
  }
}

// ── 安装/更新 ──
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Link+] Installed/updated:', details.reason);
  await getOrCreateQuickLinkFolder(); // 确保根文件夹存在
  createContextMenus();
});

// 监听书签变更以更新右键菜单
chrome.bookmarks.onCreated.addListener(() => createContextMenus());
chrome.bookmarks.onRemoved.addListener(() => createContextMenus());
chrome.bookmarks.onChanged.addListener(() => createContextMenus());
chrome.bookmarks.onMoved.addListener(() => createContextMenus());

// ── 快捷键 ──
chrome.commands.onCommand.addListener(async (command, tab) => {
  console.log('[Link+] Command:', command);

  if (command === 'toggle-search') {
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'toggle-search' });
    } catch {
      // content script 未注入时动态注入
      try {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['lib/fuse.js', 'content/inject.js', 'content/modules/api.js', 'content/modules/sync.js', 'content/modules/auth.js', 'content/modules/styles.js', 'content/modules/ui.js', 'content/modules/search.js', 'content/modules/handlers.js', 'content/modules/toast.js'] });
        await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['content/style.css'] });
        setTimeout(async () => {
          await chrome.tabs.sendMessage(tab.id, { action: 'toggle-search' });
        }, 100);
      } catch (e) {
        console.error('[Link+] Inject failed:', e);
      }
    }
  }

  if (command === 'quick-save') {
    try {
      // 检查是否为限制页面（空白页、系统页等）
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('edge://')) {
        try { await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: '空白页或系统页无法存入书签', type: 'error' }); } catch {}
        return;
      }

      // 询问 content script 当前选中的分类
      let tag = null;
      try {
        const state = await chrome.tabs.sendMessage(tab.id, { action: 'get-state' });
        if (state && state.success && state.isSearchOpen && state.activeCategory && state.activeCategory !== 'all') {
          tag = state.activeCategory;
        }
      } catch (e) {
        // 如果 content script 未加载或响应超时，忽略
      }

      const existing = await findBookmarkByUrl(tab.url);
      if (existing) {
        await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: `该网址已存在于"${existing.folder}"`, type: 'error' });
        return;
      }
      await saveBookmark({ title: tab.title, url: tab.url }, tag);
      const msg = tag ? `已保存到"${tag}"` : '已保存到"未分类"';
      await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: msg, type: 'success' });
      // 通知 content script 刷新列表
      try { await chrome.tabs.sendMessage(tab.id, { action: 'refresh-bookmarks' }); } catch {}
    } catch (e) {
      console.error('[Link+] Quick save failed:', e);
      try { await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: '保存失败，请重试', type: 'error' }); } catch {}
    }
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const id = info.menuItemId;
  if (!id.startsWith('linkplus-save-folder:')) return;

  const tag = (id === 'linkplus-save-folder:uncategorized') ? null : id.replace('linkplus-save-folder:', '');
  const url   = info.linkUrl  || tab.url;
  const title = info.linkUrl  ? (info.selectionText || info.linkUrl) : tab.title;

  // 检查是否为限制页面
  if (!url || url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('edge://')) {
    try { await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: '空白页或系统页无法存入书签', type: 'error' }); } catch {}
    return;
  }

  try {
    const existing = await findBookmarkByUrl(url);
    if (existing) {
      await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: `该网址已存在于"${existing.folder}"`, type: 'error' });
      return;
    }
    await saveBookmark({ title, url }, tag);
    await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: tag ? `已保存到"${tag}"` : '已保存到"未分类"', type: 'success' });
    // 通知 content script 刷新列表
    try { await chrome.tabs.sendMessage(tab.id, { action: 'refresh-bookmarks' }); } catch {}
  } catch (e) {
    console.error('[Link+] Context menu save failed:', e);
    try { await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: '保存失败，请重试', type: 'error' }); } catch {}
  }
});

console.log('[Link+] Background service worker initialized');
