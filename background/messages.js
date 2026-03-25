/**
 * Link+ background/messages.js
 * 来自 content script 的消息处理 / Message handler from content script
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Link+] Message received:', request.action);

  (async () => {
    switch (request.action) {

      case 'get-bookmarks': {
        const bookmarks = await getAllBookmarks();
        sendResponse({ success: true, data: bookmarks });
        break;
      }

      case 'save-bookmark': {
        const existing = await findBookmarkByUrl(request.url);
        if (existing) {
          sendResponse({ success: false, error: 'duplicate', message: `该网址已存在于"${existing.folder}"文件夹中`, existingBookmark: existing });
          return;
        }
        try {
          const result = await saveBookmark({ title: request.title, url: request.url }, request.tag);
          sendResponse({ success: true, data: result });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'delete-bookmark': {
        try {
          await chrome.bookmarks.remove(request.bookmarkId);
          clearBookmarksCache();
          sendResponse({ success: true });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'update-bookmark': {
        try {
          await chrome.bookmarks.update(request.bookmarkId, { title: request.title });
          clearBookmarksCache();
          sendResponse({ success: true });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'clear-all-bookmarks': {
        try {
          const root     = await getOrCreateQuickLinkFolder();
          const children = await chrome.bookmarks.getChildren(root.id);
          for (const child of children) await deleteBookmarkRecursive(child);
          clearBookmarksCache();
          sendResponse({ success: true, count: children.length });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'open-bookmark': {
        try {
          if (request.newTab) {
            await chrome.tabs.create({ url: request.url });
          } else {
            await chrome.tabs.update(sender.tab.id, { url: request.url });
          }
          sendResponse({ success: true });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'open-settings': {
        try {
          await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
          sendResponse({ success: true });
        } catch (e) {
          sendResponse({ success: false, error: e.message });
        }
        break;
      }

      case 'api-request': {
        // API 请求代理（绕过 CORS）
        try {
          const headers = {
            'Content-Type': 'application/json',
          };
          if (request.token) {
            headers['Authorization'] = `Bearer ${request.token}`;
          }

          const response = await fetch(request.url, {
            method: request.method,
            headers,
            body: request.body,
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            sendResponse({ success: false, error: data.error || `HTTP ${response.status}`, status: response.status });
          } else {
            sendResponse({ success: true, data, status: response.status });
          }
        } catch (e) {
          console.error('[Link+] API proxy error:', e);
          sendResponse({ success: false, error: '无法连接到服务器', status: 0 });
        }
        break;
      }

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  })();

  return true; // 异步响应
});
