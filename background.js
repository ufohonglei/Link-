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
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'linkplus-main', title: '✨ 一键存入 QuickLink', contexts: ['page', 'link', 'selection'], documentUrlPatterns: ['<all_urls>'] });
    chrome.contextMenus.create({ id: 'linkplus-save-uncategorized', parentId: 'linkplus-main', title: '📁 保存到"未分类"',   contexts: ['page', 'link', 'selection'] });
    chrome.contextMenus.create({ id: 'linkplus-save-work',          parentId: 'linkplus-main', title: '💼 保存到"工作"',     contexts: ['page', 'link', 'selection'] });
    chrome.contextMenus.create({ id: 'linkplus-save-study',         parentId: 'linkplus-main', title: '📚 保存到"学习"',     contexts: ['page', 'link', 'selection'] });
    chrome.contextMenus.create({ id: 'linkplus-save-readlater',     parentId: 'linkplus-main', title: '📖 保存到"稍后阅读"', contexts: ['page', 'link', 'selection'] });
  });
}

// ── 安装/更新 ──
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Link+] Installed/updated:', details.reason);
  createContextMenus();
  getOrCreateQuickLinkFolder(); // 确保根文件夹存在
});

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
      const existing = await findBookmarkByUrl(tab.url);
      if (existing) {
        await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: `该网址已存在于"${existing.folder}"`, type: 'error' });
        return;
      }
      await saveBookmark({ title: tab.title, url: tab.url }, null);
      await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: '已保存到"未分类"', type: 'success' });
    } catch (e) {
      console.error('[Link+] Quick save failed:', e);
      try { await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: '保存失败，请重试', type: 'error' }); } catch {}
    }
  }
});

// ── 右键菜单点击 ──
const MENU_TAG_MAP = {
  'linkplus-save-uncategorized': null,
  'linkplus-save-work':          '工作',
  'linkplus-save-study':         '学习',
  'linkplus-save-readlater':     '稍后阅读',
};

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!(info.menuItemId in MENU_TAG_MAP)) return;
  const tag   = MENU_TAG_MAP[info.menuItemId];
  const url   = info.linkUrl  || tab.url;
  const title = info.linkUrl  ? (info.selectionText || info.linkUrl) : tab.title;

  try {
    const existing = await findBookmarkByUrl(url);
    if (existing) {
      await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: `该网址已存在于"${existing.folder}"`, type: 'error' });
      return;
    }
    await saveBookmark({ title, url }, tag);
    await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: tag ? `已保存到"${tag}"` : '已保存到"未分类"', type: 'success' });
  } catch (e) {
    console.error('[Link+] Context menu save failed:', e);
    try { await chrome.tabs.sendMessage(tab.id, { action: 'show-toast', message: '保存失败，请重试', type: 'error' }); } catch {}
  }
});

console.log('[Link+] Background service worker initialized');
