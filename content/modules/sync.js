/**
 * Link+ sync.js
 * 云同步逻辑 / Cloud sync logic
 *
 * 同步策略：
 * - 未登录：仅使用本地 chrome.bookmarks
 * - 已登录：双向同步（本地 ↔ 服务器）
 * - 冲突解决：以服务器为准，或时间戳较新为准
 * - 增量操作：新增/编辑/删除同时操作两端
 */

/* global LinkPlus */

/**
 * 初始化同步状态（插件启动时调用）
 * 检查本地 Token，恢复登录状态
 */
LinkPlus.syncInit = async function() {
  const token = await LinkPlus.api.getToken();
  if (!token) {
    LinkPlus.state.isLoggedIn = false;
    LinkPlus.state.user = null;
    return;
  }

  // 验证 Token 有效性
  const result = await LinkPlus.api.getCurrentUser();
  if (result.success) {
    LinkPlus.state.isLoggedIn = true;
    LinkPlus.state.user = result.data.user;
    console.log('[Link+] Auto login success:', LinkPlus.state.user.email);
    // 登录成功后执行双向同步
    await LinkPlus.twoWaySync();
  } else {
    // Token 失效，清除
    await LinkPlus.api.logout();
    LinkPlus.state.isLoggedIn = false;
    LinkPlus.state.user = null;
    console.log('[Link+] Token expired, cleared');
  }
};

/**
 * 登录后同步：将本地书签批量导入到服务器
 * 仅在首次登录（服务器无数据）或用户确认时调用
 */
LinkPlus.syncLocalToServer = async function() {
  try {
    // 获取本地所有书签
    const localRes = await chrome.runtime.sendMessage({ action: 'get-bookmarks' });
    if (!localRes.success || !localRes.data.length) return { synced: 0 };

    // 转换格式：本地 folder -> 服务器 category
    const bookmarks = localRes.data.map(b => ({
      title: b.title,
      url: b.url,
      category: (b.folder && b.folder !== 'QuickLink_Data') ? b.folder : '未分类',
    }));

    const result = await LinkPlus.api.bulkCreateBookmarks(bookmarks);
    if (result.success) {
      console.log(`[Link+] Synced ${bookmarks.length} local bookmarks to server`);
      return { synced: bookmarks.length };
    }
    return { synced: 0, error: result.error };
  } catch (e) {
    console.error('[Link+] syncLocalToServer failed:', e);
    return { synced: 0, error: e.message };
  }
};

/**
 * 从服务器加载书签（已登录时替换 loadBookmarks）
 */
LinkPlus.loadBookmarksFromServer = async function() {
  try {
    const result = await LinkPlus.api.getBookmarks();
    if (result.success) {
      // 将服务器数据转换为本地格式
      const bookmarks = (result.data.bookmarks || []).map(b => ({
        id: b.id,          // 服务器 UUID（用于云操作）
        title: b.title,
        url: b.url,
        folder: b.category || '未分类',
        dateAdded: new Date(b.createdAt).getTime(),
        isCloud: true,     // 标记为云端书签
      }));
      LinkPlus.state.bookmarks = bookmarks;
      LinkPlus.initFuse();
      return true;
    }
    // 服务器请求失败，回退到本地
    console.warn('[Link+] Server load failed, fallback to local');
    return false;
  } catch (e) {
    console.error('[Link+] loadBookmarksFromServer failed:', e);
    return false;
  }
};

/**
 * 同步新增书签到服务器
 */
LinkPlus.syncCreateBookmark = async function(title, url, category) {
  if (!LinkPlus.state.isLoggedIn) return null;
  try {
    const result = await LinkPlus.api.createBookmark(title, url, category || '未分类');
    if (result.success) {
      console.log('[Link+] Bookmark synced to server:', title);
      return result.data.bookmark;
    }
    console.warn('[Link+] syncCreate failed:', result.error);
    return null;
  } catch (e) {
    console.error('[Link+] syncCreateBookmark failed:', e);
    return null;
  }
};

/**
 * 同步更新书签到服务器（通过 serverId）
 */
LinkPlus.syncUpdateBookmark = async function(serverId, data) {
  if (!LinkPlus.state.isLoggedIn || !serverId) return false;
  try {
    const result = await LinkPlus.api.updateBookmark(serverId, data);
    return result.success;
  } catch (e) {
    console.error('[Link+] syncUpdateBookmark failed:', e);
    return false;
  }
};

/**
 * 同步更新书签到服务器（通过 URL 查找）
 * 用于本地书签编辑后同步到服务器
 */
LinkPlus.syncUpdateBookmarkByUrl = async function(url, data) {
  if (!LinkPlus.state.isLoggedIn || !url) return false;
  try {
    // 先获取服务器书签列表，查找匹配的 URL
    const result = await LinkPlus.api.getBookmarks();
    if (!result.success) return false;
    
    const serverBookmarks = result.data.bookmarks || [];
    const serverBookmark = serverBookmarks.find(b => b.url === url);
    
    if (serverBookmark) {
      // 找到对应的书签，更新它
      const updateResult = await LinkPlus.api.updateBookmark(serverBookmark.id, data);
      console.log('[Link+] Synced update to server by URL:', url);
      return updateResult.success;
    } else {
      console.log('[Link+] Bookmark not found on server, skipping sync:', url);
      return false;
    }
  } catch (e) {
    console.error('[Link+] syncUpdateBookmarkByUrl failed:', e);
    return false;
  }
};

/**
 * 同步删除书签到服务器（通过 serverId）
 */
LinkPlus.syncDeleteBookmark = async function(serverId) {
  if (!LinkPlus.state.isLoggedIn || !serverId) return false;
  try {
    const result = await LinkPlus.api.deleteBookmark(serverId);
    return result.success;
  } catch (e) {
    console.error('[Link+] syncDeleteBookmark failed:', e);
    return false;
  }
};

/**
 * 同步删除书签到服务器（通过 URL 查找）
 * 用于本地书签删除后同步到服务器
 */
LinkPlus.syncDeleteBookmarkByUrl = async function(url) {
  if (!LinkPlus.state.isLoggedIn || !url) return false;
  try {
    // 先获取服务器书签列表，查找匹配的 URL
    const result = await LinkPlus.api.getBookmarks();
    if (!result.success) return false;
    
    const serverBookmarks = result.data.bookmarks || [];
    const serverBookmark = serverBookmarks.find(b => b.url === url);
    
    if (serverBookmark) {
      // 找到对应的书签，删除它
      const deleteResult = await LinkPlus.api.deleteBookmark(serverBookmark.id);
      console.log('[Link+] Synced delete to server by URL:', url);
      return deleteResult.success;
    } else {
      console.log('[Link+] Bookmark not found on server, skipping delete sync:', url);
      return false;
    }
  } catch (e) {
    console.error('[Link+] syncDeleteBookmarkByUrl failed:', e);
    return false;
  }
};

/**
 * 同步清空书签到服务器
 */
LinkPlus.syncClearBookmarks = async function() {
  if (!LinkPlus.state.isLoggedIn) return false;
  try {
    const result = await LinkPlus.api.clearBookmarks();
    return result.success;
  } catch (e) {
    console.error('[Link+] syncClearBookmarks failed:', e);
    return false;
  }
};

/**
 * 双向同步：合并本地和服务器书签
 * 策略：
 * 1. 获取本地书签
 * 2. 获取服务器书签
 * 3. 合并（以 URL 为唯一标识，服务器数据优先）
 * 4. 将合并后的数据同步回两端
 */
LinkPlus.twoWaySync = async function() {
  if (!LinkPlus.state.isLoggedIn) return;
  
  console.log('[Link+] Starting two-way sync...');
  
  try {
    // 1. 获取本地书签
    const localRes = await chrome.runtime.sendMessage({ action: 'get-bookmarks' });
    const localBookmarks = localRes.success ? localRes.data : [];
    console.log('[Link+] Local bookmarks:', localBookmarks.length);
    
    // 2. 获取服务器书签
    const serverRes = await LinkPlus.api.getBookmarks();
    const serverBookmarks = serverRes.success ? (serverRes.data.bookmarks || []) : [];
    console.log('[Link+] Server bookmarks:', serverBookmarks.length);
    
    // 3. 合并（以 URL 为 key，服务器数据优先）
    const bookmarkMap = new Map();
    
    // 先加入本地书签
    localBookmarks.forEach(bm => {
      bookmarkMap.set(bm.url, {
        title: bm.title,
        url: bm.url,
        category: (bm.folder && bm.folder !== 'QuickLink_Data') ? bm.folder : '未分类',
        source: 'local'
      });
    });
    
    // 服务器书签覆盖（优先）
    serverBookmarks.forEach(bm => {
      bookmarkMap.set(bm.url, {
        title: bm.title,
        url: bm.url,
        category: bm.category || '未分类',
        source: 'server',
        serverId: bm.id
      });
    });
    
    const mergedBookmarks = Array.from(bookmarkMap.values());
    console.log('[Link+] Merged bookmarks:', mergedBookmarks.length);
    
    // 4. 同步回服务器（本地独有的上传到服务器）
    const localOnly = mergedBookmarks.filter(b => b.source === 'local');
    if (localOnly.length > 0) {
      console.log('[Link+] Uploading local-only bookmarks:', localOnly.length);
      const uploadData = localOnly.map(b => ({
        title: b.title,
        url: b.url,
        category: b.category
      }));
      const bulkResult = await LinkPlus.api.bulkCreateBookmarks(uploadData);
      if (bulkResult.success) {
        console.log('[Link+] Bulk upload result:', bulkResult.data?.message || 'Success');
      } else {
        console.warn('[Link+] Bulk upload failed:', bulkResult.error);
      }
    }
    
    // 5. 同步回本地（服务器独有的下载到本地）
    const serverOnly = mergedBookmarks.filter(b => b.source === 'server');
    if (serverOnly.length > 0) {
      console.log('[Link+] Downloading server-only bookmarks:', serverOnly.length);
      for (const bm of serverOnly) {
        // 检查本地是否已存在（避免重复）
        const exists = localBookmarks.some(lb => lb.url === bm.url);
        if (!exists) {
          await chrome.runtime.sendMessage({
            action: 'save-bookmark',
            title: bm.title,
            url: bm.url,
            tag: bm.category === '未分类' ? null : bm.category
          });
        }
      }
    }
    
    console.log('[Link+] Two-way sync completed');
    
    // 6. 重新加载书签列表
    await LinkPlus.loadBookmarks();
    
  } catch (e) {
    console.error('[Link+] Two-way sync failed:', e);
  }
};

console.log('[Link+] Sync module loaded');
