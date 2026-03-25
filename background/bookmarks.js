/**
 * Link+ background/bookmarks.js
 * 书签增删改查、缓存管理 / Bookmark CRUD and cache management
 */

const QUICKLINK_FOLDER_NAME   = 'QuickLink_Data';
const UNCATEGORIZED_FOLDER    = '未分类';
const CACHE_KEY               = 'linkplus_bookmarks_cache';
const CACHE_TTL               = 5 * 60 * 1000; // 5 分钟

// ── 缓存 ──
async function cacheBookmarks(bookmarks) {
  await chrome.storage.local.set({ [CACHE_KEY]: { data: bookmarks, ts: Date.now() } });
}
async function getCachedBookmarks() {
  const r = await chrome.storage.local.get(CACHE_KEY);
  const c = r[CACHE_KEY];
  return (c && Date.now() - c.ts < CACHE_TTL) ? c.data : null;
}
async function clearBookmarksCache() {
  await chrome.storage.local.remove(CACHE_KEY);
}

// ── 文件夹操作 ──
async function getOrCreateQuickLinkFolder() {
  return new Promise((resolve) => {
    chrome.bookmarks.search({ title: QUICKLINK_FOLDER_NAME }, (results) => {
      const folder = results.find(b => !b.url);
      if (folder) { resolve(folder); return; }
      chrome.bookmarks.create({ title: QUICKLINK_FOLDER_NAME }, resolve);
    });
  });
}

async function getOrCreateSubFolder(parentId, name) {
  return new Promise((resolve) => {
    chrome.bookmarks.getChildren(parentId, (children) => {
      const existing = children.find(c => !c.url && c.title === name);
      if (existing) { resolve(existing); return; }
      chrome.bookmarks.create({ parentId, title: name }, resolve);
    });
  });
}

// ── 书签操作 ──
async function saveBookmark({ title, url }, tag = null) {
  const root     = await getOrCreateQuickLinkFolder();
  const folderName = (tag && tag.trim()) ? tag.trim() : UNCATEGORIZED_FOLDER;
  const folder   = await getOrCreateSubFolder(root.id, folderName);

  return new Promise((resolve) => {
    chrome.bookmarks.create({ parentId: folder.id, title, url }, (bm) => {
      clearBookmarksCache();
      resolve(bm);
    });
  });
}

function flattenBookmarks(folder, result = []) {
  if (!folder.children) return result;
  for (const child of folder.children) {
    if (child.url) {
      result.push({ id: child.id, title: child.title, url: child.url, folder: folder.title, dateAdded: child.dateAdded });
    } else {
      flattenBookmarks(child, result);
    }
  }
  return result;
}

async function getAllBookmarks() {
  const cached = await getCachedBookmarks();
  if (cached) return cached;

  const root = await getOrCreateQuickLinkFolder();
  return new Promise((resolve) => {
    chrome.bookmarks.getSubTree(root.id, (results) => {
      const bookmarks = flattenBookmarks(results[0]);
      cacheBookmarks(bookmarks);
      resolve(bookmarks);
    });
  });
}

async function findBookmarkByUrl(url) {
  const all = await getAllBookmarks();
  return all.find(b => b.url === url) || null;
}

async function deleteBookmarkRecursive(node) {
  return new Promise((resolve) => {
    if (!node.url) {
      chrome.bookmarks.getChildren(node.id, async (children) => {
        for (const child of children) await deleteBookmarkRecursive(child);
        chrome.bookmarks.remove(node.id, resolve);
      });
    } else {
      chrome.bookmarks.remove(node.id, resolve);
    }
  });
}

// 书签变更时清缓存
chrome.bookmarks.onCreated.addListener(clearBookmarksCache);
chrome.bookmarks.onRemoved.addListener(clearBookmarksCache);
chrome.bookmarks.onChanged.addListener(clearBookmarksCache);
chrome.bookmarks.onMoved.addListener(clearBookmarksCache);
