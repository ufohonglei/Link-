/**
 * Link+ Background Service Worker
 * 
 * 功能：
 * 1. 处理快捷键监听（Alt+B 打开搜索面板，Alt+Shift+S 静默保存）
 * 2. 创建和管理右键菜单
 * 3. 处理书签的增删改查逻辑
 * 4. 与 content script 通信
 */

// ============================================
// 常量定义 / Constants
// ============================================
const QUICKLINK_FOLDER_NAME = 'QuickLink_Data';
const UNCATEGORIZED_FOLDER_NAME = '未分类';
const STORAGE_KEY_BOOKMARKS_CACHE = 'linkplus_bookmarks_cache';

// ============================================
// 初始化 / Initialization
// ============================================

/**
 * 扩展安装或更新时初始化
 * Initialize when extension is installed or updated
 */
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Link+] Extension installed/updated:', details.reason);
  
  // 创建右键菜单 / Create context menus
  createContextMenus();
  
  // 确保 QuickLink_Data 文件夹存在 / Ensure QuickLink_Data folder exists
  ensureQuickLinkFolder();
});

/**
 * 创建右键菜单
 * Create context menu items
 */
function createContextMenus() {
  // 移除现有菜单 / Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // 主菜单项 / Main menu item
    chrome.contextMenus.create({
      id: 'linkplus-main',
      title: '✨ 一键存入 QuickLink',
      contexts: ['page', 'link', 'selection'],
      documentUrlPatterns: ['<all_urls>']
    });
    
    // 子菜单：保存到未分类 / Submenu: Save to uncategorized
    chrome.contextMenus.create({
      id: 'linkplus-save-uncategorized',
      parentId: 'linkplus-main',
      title: '📁 保存到"未分类"',
      contexts: ['page', 'link', 'selection']
    });
    
    // 子菜单：保存并添加标签 / Submenu: Save with tag
    chrome.contextMenus.create({
      id: 'linkplus-save-work',
      parentId: 'linkplus-main',
      title: '💼 保存到"工作"',
      contexts: ['page', 'link', 'selection']
    });
    
    chrome.contextMenus.create({
      id: 'linkplus-save-study',
      parentId: 'linkplus-main',
      title: '📚 保存到"学习"',
      contexts: ['page', 'link', 'selection']
    });
    
    chrome.contextMenus.create({
      id: 'linkplus-save-readlater',
      parentId: 'linkplus-main',
      title: '📖 保存到"稍后阅读"',
      contexts: ['page', 'link', 'selection']
    });
  });
}

// ============================================
// 书签管理 / Bookmark Management
// ============================================

/**
 * 获取或创建 QuickLink_Data 文件夹
 * Get or create QuickLink_Data folder
 * @returns {Promise<Object>} 文件夹对象 / Folder object
 */
async function getOrCreateQuickLinkFolder() {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.search({ title: QUICKLINK_FOLDER_NAME }, (results) => {
      const folder = results.find(b => b.url === undefined); // 文件夹没有 url / Folders don't have url
      if (folder) {
        resolve(folder);
      } else {
        // 创建文件夹 / Create folder
        chrome.bookmarks.create({
          title: QUICKLINK_FOLDER_NAME
        }, (newFolder) => {
          console.log('[Link+] Created folder:', newFolder.title);
          resolve(newFolder);
        });
      }
    });
  });
}

/**
 * 递归删除书签或文件夹
 * Recursively delete bookmark or folder
 * @param {Object} bookmark - 书签或文件夹对象 / Bookmark or folder object
 * @returns {Promise<void>}
 */
async function deleteBookmarkRecursive(bookmark) {
  return new Promise((resolve, reject) => {
    // 如果是文件夹，先删除子项 / If folder, delete children first
    if (!bookmark.url) {
      chrome.bookmarks.getChildren(bookmark.id, async (children) => {
        for (const child of children) {
          await deleteBookmarkRecursive(child);
        }
        // 删除空文件夹 / Delete empty folder
        chrome.bookmarks.remove(bookmark.id, () => {
          resolve();
        });
      });
    } else {
      // 删除书签 / Delete bookmark
      chrome.bookmarks.remove(bookmark.id, () => {
        resolve();
      });
    }
  });
}

/**
 * 确保 QuickLink_Data 文件夹存在
 * Ensure QuickLink_Data folder exists
 */
async function ensureQuickLinkFolder() {
  await getOrCreateQuickLinkFolder();
}

/**
 * 获取或创建子文件夹
 * Get or create subfolder
 * @param {string} parentId - 父文件夹 ID / Parent folder ID
 * @param {string} folderName - 子文件夹名称 / Subfolder name
 * @returns {Promise<Object>} 子文件夹对象 / Subfolder object
 */
async function getOrCreateSubFolder(parentId, folderName) {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getChildren(parentId, (children) => {
      const existingFolder = children.find(
        child => child.url === undefined && child.title === folderName
      );
      
      if (existingFolder) {
        resolve(existingFolder);
      } else {
        chrome.bookmarks.create({
          parentId: parentId,
          title: folderName
        }, (newFolder) => {
          console.log('[Link+] Created subfolder:', newFolder.title);
          resolve(newFolder);
        });
      }
    });
  });
}

/**
 * 保存书签到指定文件夹
 * Save bookmark to specified folder
 * @param {Object} bookmarkData - 书签数据 / Bookmark data
 * @param {string} tag - 标签（子文件夹名称）/ Tag (subfolder name)
 * @returns {Promise<Object>} 创建的书签 / Created bookmark
 */
async function saveBookmark(bookmarkData, tag = null) {
  const quickLinkFolder = await getOrCreateQuickLinkFolder();
  
  let targetFolderId = quickLinkFolder.id;
  
  // 如果有标签，保存到对应子文件夹 / If tag exists, save to corresponding subfolder
  if (tag && tag.trim()) {
    const subFolder = await getOrCreateSubFolder(quickLinkFolder.id, tag.trim());
    targetFolderId = subFolder.id;
  } else {
    // 默认保存到"未分类" / Default save to "uncategorized"
    const uncategorizedFolder = await getOrCreateSubFolder(
      quickLinkFolder.id, 
      UNCATEGORIZED_FOLDER_NAME
    );
    targetFolderId = uncategorizedFolder.id;
  }
  
  return new Promise((resolve, reject) => {
    chrome.bookmarks.create({
      parentId: targetFolderId,
      title: bookmarkData.title,
      url: bookmarkData.url
    }, (bookmark) => {
      console.log('[Link+] Saved bookmark:', bookmark.title);
      // 清除缓存 / Clear cache
      clearBookmarksCache();
      resolve(bookmark);
    });
  });
}

/**
 * 获取 QuickLink_Data 文件夹下的所有书签
 * Get all bookmarks under QuickLink_Data folder
 * @returns {Promise<Array>} 书签数组 / Bookmarks array
 */
async function getAllQuickLinkBookmarks() {
  // 先检查缓存 / Check cache first
  const cached = await getCachedBookmarks();
  if (cached) {
    return cached;
  }
  
  const quickLinkFolder = await getOrCreateQuickLinkFolder();
  
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getSubTree(quickLinkFolder.id, (results) => {
      const bookmarks = flattenBookmarks(results[0]);
      // 缓存结果 / Cache results
      cacheBookmarks(bookmarks);
      resolve(bookmarks);
    });
  });
}

/**
 * 将书签树扁平化为数组
 * Flatten bookmark tree to array
 * @param {Object} folder - 书签文件夹 / Bookmark folder
 * @param {Array} result - 结果数组 / Result array
 * @returns {Array} 扁平化的书签数组 / Flattened bookmarks array
 */
function flattenBookmarks(folder, result = []) {
  if (!folder.children) return result;
  
  for (const child of folder.children) {
    if (child.url) {
      // 这是一个书签 / This is a bookmark
      result.push({
        id: child.id,
        title: child.title,
        url: child.url,
        folder: folder.title,
        dateAdded: child.dateAdded
      });
    } else {
      // 这是一个文件夹 / This is a folder
      flattenBookmarks(child, result);
    }
  }
  
  return result;
}

/**
 * 根据 URL 查找书签
 * Find bookmark by URL
 * @param {string} url - 要查找的 URL / URL to find
 * @returns {Promise<Object|null>} 找到的书签或 null / Found bookmark or null
 */
async function findBookmarkByUrl(url) {
  const bookmarks = await getAllQuickLinkBookmarks();
  return bookmarks.find(b => b.url === url) || null;
}

// ============================================
// 缓存管理 / Cache Management
// ============================================

/**
 * 缓存书签数据
 * Cache bookmarks data
 * @param {Array} bookmarks - 书签数组 / Bookmarks array
 */
async function cacheBookmarks(bookmarks) {
  await chrome.storage.local.set({
    [STORAGE_KEY_BOOKMARKS_CACHE]: {
      data: bookmarks,
      timestamp: Date.now()
    }
  });
}

/**
 * 获取缓存的书签
 * Get cached bookmarks
 * @returns {Promise<Array|null>} 缓存的书签或 null / Cached bookmarks or null
 */
async function getCachedBookmarks() {
  const result = await chrome.storage.local.get(STORAGE_KEY_BOOKMARKS_CACHE);
  const cache = result[STORAGE_KEY_BOOKMARKS_CACHE];
  
  if (cache && (Date.now() - cache.timestamp < 5 * 60 * 1000)) {
    // 缓存5分钟内有效 / Cache valid for 5 minutes
    return cache.data;
  }
  
  return null;
}

/**
 * 清除书签缓存
 * Clear bookmarks cache
 */
async function clearBookmarksCache() {
  await chrome.storage.local.remove(STORAGE_KEY_BOOKMARKS_CACHE);
}

// ============================================
// 快捷键处理 / Keyboard Shortcuts
// ============================================

/**
 * 监听快捷键命令
 * Listen for keyboard commands
 */
chrome.commands.onCommand.addListener(async (command, tab) => {
  console.log('[Link+] Command received:', command);
  
  switch (command) {
    case 'toggle-search':
      // 切换搜索面板 / Toggle search panel
      await toggleSearchPanel(tab);
      break;
      
    case 'quick-save':
      // 静默快速保存 / Quick save silently
      await quickSave(tab);
      break;
  }
});

/**
 * 切换搜索面板显示状态
 * Toggle search panel visibility
 * @param {Object} tab - 当前标签页 / Current tab
 */
async function toggleSearchPanel(tab) {
  try {
    // 先尝试发送消息 / Try to send message first
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle-search' });
  } catch (error) {
    // 如果 content script 未注入，尝试动态注入 / If content script not injected, try to inject
    console.log('[Link+] Content script not ready, injecting...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['lib/fuse.js', 'content/inject.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/style.css']
      });
      // 注入后再次尝试发送消息 / Try sending message again after injection
      setTimeout(async () => {
        await chrome.tabs.sendMessage(tab.id, { action: 'toggle-search' });
      }, 100);
    } catch (injectError) {
      console.error('[Link+] Failed to inject content script:', injectError);
    }
  }
}

/**
 * 静默快速保存当前页面
 * Quick save current page silently
 * @param {Object} tab - 当前标签页 / Current tab
 */
async function quickSave(tab) {
  try {
    // 检查 URL 是否已存在 / Check if URL already exists
    const existingBookmark = await findBookmarkByUrl(tab.url);
    if (existingBookmark) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'show-toast',
        message: `该网址已存在于"${existingBookmark.folder}"`,
        type: 'error'
      });
      return;
    }
    
    const bookmarkData = {
      title: tab.title,
      url: tab.url
    };
    
    await saveBookmark(bookmarkData, null);
    
    // 发送成功通知 / Send success notification
    await chrome.tabs.sendMessage(tab.id, {
      action: 'show-toast',
      message: '已保存到"未分类"',
      type: 'success'
    });
    
  } catch (error) {
    console.error('[Link+] Failed to quick save:', error);
    
    // 发送错误通知 / Send error notification
    await chrome.tabs.sendMessage(tab.id, {
      action: 'show-toast',
      message: '保存失败，请重试',
      type: 'error'
    });
  }
}

// ============================================
// 右键菜单处理 / Context Menu Handlers
// ============================================

/**
 * 监听右键菜单点击
 * Listen for context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('[Link+] Context menu clicked:', info.menuItemId);
  
  let tag = null;
  
  switch (info.menuItemId) {
    case 'linkplus-save-uncategorized':
      tag = null;
      break;
    case 'linkplus-save-work':
      tag = '工作';
      break;
    case 'linkplus-save-study':
      tag = '学习';
      break;
    case 'linkplus-save-readlater':
      tag = '稍后阅读';
      break;
    default:
      return;
  }
  
  try {
    // 获取要保存的 URL 和标题 / Get URL and title to save
    let url = tab.url;
    let title = tab.title;
    
    // 如果点击的是链接 / If clicked on a link
    if (info.linkUrl) {
      url = info.linkUrl;
      title = info.selectionText || info.linkUrl;
    }
    
    // 检查 URL 是否已存在 / Check if URL already exists
    const existingBookmark = await findBookmarkByUrl(url);
    if (existingBookmark) {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'show-toast',
        message: `该网址已存在于"${existingBookmark.folder}"`,
        type: 'error'
      });
      return;
    }
    
    const bookmarkData = { title, url };
    await saveBookmark(bookmarkData, tag);
    
    // 发送成功通知 / Send success notification
    const message = tag 
      ? `已保存到"${tag}"` 
      : '已保存到"未分类"';
    
    await chrome.tabs.sendMessage(tab.id, {
      action: 'show-toast',
      message: message,
      type: 'success'
    });
    
  } catch (error) {
    console.error('[Link+] Failed to save from context menu:', error);
    
    await chrome.tabs.sendMessage(tab.id, {
      action: 'show-toast',
      message: '保存失败，请重试',
      type: 'error'
    });
  }
});

// ============================================
// 消息处理 / Message Handling
// ============================================

/**
 * 监听来自 content script 的消息
 * Listen for messages from content script
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Link+] Message received:', request.action);
  
  // 使用异步处理 / Use async handling
  (async () => {
    switch (request.action) {
      case 'get-bookmarks':
        // 获取所有书签 / Get all bookmarks
        const bookmarks = await getAllQuickLinkBookmarks();
        sendResponse({ success: true, data: bookmarks });
        break;
        
      case 'save-bookmark':
        // 保存书签 / Save bookmark
        try {
          // 检查 URL 是否已存在 / Check if URL already exists
          const existingBookmark = await findBookmarkByUrl(request.url);
          if (existingBookmark) {
            sendResponse({ 
              success: false, 
              error: 'duplicate',
              message: `该网址已存在于"${existingBookmark.folder}"文件夹中`,
              existingBookmark: existingBookmark
            });
            return;
          }
          
          const result = await saveBookmark(
            { title: request.title, url: request.url },
            request.tag
          );
          sendResponse({ success: true, data: result });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'delete-bookmark':
        // 删除书签 / Delete bookmark
        try {
          await chrome.bookmarks.remove(request.bookmarkId);
          clearBookmarksCache();
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'update-bookmark':
        // 更新书签 / Update bookmark
        try {
          await chrome.bookmarks.update(request.bookmarkId, {
            title: request.title
          });
          clearBookmarksCache();
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'clear-all-bookmarks':
        // 清空所有书签 / Clear all bookmarks
        try {
          const quickLinkFolder = await getOrCreateQuickLinkFolder();
          const children = await chrome.bookmarks.getChildren(quickLinkFolder.id);
          
          let count = 0;
          // 递归删除所有子项 / Recursively delete all children
          for (const child of children) {
            await deleteBookmarkRecursive(child);
            count++;
          }
          
          clearBookmarksCache();
          sendResponse({ success: true, count: count });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'open-bookmark':
        // 打开书签 / Open bookmark
        try {
          if (request.newTab) {
            await chrome.tabs.create({ url: request.url });
          } else {
            await chrome.tabs.update(sender.tab.id, { url: request.url });
          }
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'open-settings':
        // 打开设置页面 / Open settings page
        try {
          await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  })();
  
  // 返回 true 表示异步响应 / Return true for async response
  return true;
});

// ============================================
// 书签变更监听 / Bookmark Change Listeners
// ============================================

/**
 * 监听书签变更，清除缓存
 * Listen for bookmark changes and clear cache
 */
chrome.bookmarks.onCreated.addListener(() => clearBookmarksCache());
chrome.bookmarks.onRemoved.addListener(() => clearBookmarksCache());
chrome.bookmarks.onChanged.addListener(() => clearBookmarksCache());
chrome.bookmarks.onMoved.addListener(() => clearBookmarksCache());

console.log('[Link+] Background service worker initialized');
