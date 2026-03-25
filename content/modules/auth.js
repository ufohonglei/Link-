/**
 * Link+ auth.js
 * 登录/注册 UI、Token 管理、用户状态 / Auth UI, token management, user state
 */

/* global LinkPlus */

/**
 * 打开登录/注册弹窗
 */
LinkPlus.handleOpenAuth = function() {
  // 若已有弹窗则不重复创建
  if (LinkPlus.shadowRoot.getElementById('linkplus-auth-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'linkplus-auth-modal';
  modal.innerHTML = `
    <div class="linkplus-auth-overlay">
      <div class="linkplus-auth-content">

        <div class="linkplus-auth-header">
          <h2 class="linkplus-auth-title">登录 Link+</h2>
          <button class="linkplus-auth-close" id="linkplus-auth-close">✕</button>
        </div>

        <!-- Tab 切换 -->
        <div class="linkplus-auth-tabs">
          <button class="linkplus-auth-tab active" data-tab="login">登录</button>
          <button class="linkplus-auth-tab" data-tab="register">注册</button>
        </div>

        <!-- 登录表单 -->
        <div class="linkplus-auth-form" id="linkplus-auth-form-login">
          <div class="linkplus-auth-field">
            <label>邮箱</label>
            <input type="email" id="linkplus-login-email" placeholder="your@email.com" autocomplete="email">
          </div>
          <div class="linkplus-auth-field">
            <label>密码</label>
            <input type="password" id="linkplus-login-password" placeholder="输入密码" autocomplete="current-password">
          </div>
          <div class="linkplus-auth-error" id="linkplus-login-error"></div>
          <button class="linkplus-auth-submit" id="linkplus-login-submit">
            <span class="linkplus-auth-submit-text">登录</span>
            <span class="linkplus-auth-loading" style="display:none">登录中...</span>
          </button>
        </div>

        <!-- 注册表单 -->
        <div class="linkplus-auth-form" id="linkplus-auth-form-register" style="display:none">
          <div class="linkplus-auth-field">
            <label>邮箱</label>
            <input type="email" id="linkplus-register-email" placeholder="your@email.com" autocomplete="email">
          </div>
          <div class="linkplus-auth-field">
            <label>昵称</label>
            <input type="text" id="linkplus-register-name" placeholder="你的名字" autocomplete="nickname">
          </div>
          <div class="linkplus-auth-field">
            <label>密码</label>
            <input type="password" id="linkplus-register-password" placeholder="至少 6 个字符" autocomplete="new-password">
          </div>
          <div class="linkplus-auth-error" id="linkplus-register-error"></div>
          <button class="linkplus-auth-submit" id="linkplus-register-submit">
            <span class="linkplus-auth-submit-text">注册</span>
            <span class="linkplus-auth-loading" style="display:none">注册中...</span>
          </button>
        </div>

        <p class="linkplus-auth-tip">登录后书签将自动同步到云端，支持多设备使用</p>
      </div>
    </div>
  `;

  LinkPlus.shadowRoot.appendChild(modal);

  const closeModal = () => modal.remove();

  // 关闭按钮
  modal.querySelector('#linkplus-auth-close').addEventListener('click', closeModal);
  modal.querySelector('.linkplus-auth-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // ESC 关闭
  const onEsc = (e) => {
    if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); }
  };
  document.addEventListener('keydown', onEsc);

  // Tab 切换
  modal.querySelectorAll('.linkplus-auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      modal.querySelectorAll('.linkplus-auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      modal.querySelector('#linkplus-auth-form-login').style.display    = target === 'login'    ? 'block' : 'none';
      modal.querySelector('#linkplus-auth-form-register').style.display = target === 'register' ? 'block' : 'none';
      modal.querySelector('.linkplus-auth-title').textContent = target === 'login' ? '登录 Link+' : '注册 Link+';
    });
  });

  // 登录提交
  modal.querySelector('#linkplus-login-submit').addEventListener('click', async () => {
    const email    = modal.querySelector('#linkplus-login-email').value.trim();
    const password = modal.querySelector('#linkplus-login-password').value;
    const errEl    = modal.querySelector('#linkplus-login-error');
    const btn      = modal.querySelector('#linkplus-login-submit');

    if (!email || !password) { errEl.textContent = '请填写邮箱和密码'; return; }

    errEl.textContent = '';
    btn.querySelector('.linkplus-auth-submit-text').style.display  = 'none';
    btn.querySelector('.linkplus-auth-loading').style.display      = 'inline';
    btn.disabled = true;

    const result = await LinkPlus.api.login(email, password);

    btn.querySelector('.linkplus-auth-submit-text').style.display  = 'inline';
    btn.querySelector('.linkplus-auth-loading').style.display      = 'none';
    btn.disabled = false;

    if (result.success) {
      await LinkPlus.handleLoginSuccess(result.data.user, closeModal);
    } else {
      errEl.textContent = result.error === 'HTTP 401' ? '邮箱或密码错误' : (result.error || '登录失败，请重试');
    }
  });

  // 注册提交
  modal.querySelector('#linkplus-register-submit').addEventListener('click', async () => {
    const email    = modal.querySelector('#linkplus-register-email').value.trim();
    const name     = modal.querySelector('#linkplus-register-name').value.trim();
    const password = modal.querySelector('#linkplus-register-password').value;
    const errEl    = modal.querySelector('#linkplus-register-error');
    const btn      = modal.querySelector('#linkplus-register-submit');

    if (!email || !name || !password) { errEl.textContent = '请填写所有字段'; return; }
    if (password.length < 6) { errEl.textContent = '密码至少 6 个字符'; return; }

    errEl.textContent = '';
    btn.querySelector('.linkplus-auth-submit-text').style.display  = 'none';
    btn.querySelector('.linkplus-auth-loading').style.display      = 'inline';
    btn.disabled = true;

    const result = await LinkPlus.api.register(email, name, password);

    btn.querySelector('.linkplus-auth-submit-text').style.display  = 'inline';
    btn.querySelector('.linkplus-auth-loading').style.display      = 'none';
    btn.disabled = false;

    if (result.success) {
      await LinkPlus.handleLoginSuccess(result.data.user, closeModal);
    } else {
      errEl.textContent = result.error || '注册失败，请重试';
    }
  });

  // 回车提交
  modal.querySelector('#linkplus-login-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') modal.querySelector('#linkplus-login-submit').click();
  });
  modal.querySelector('#linkplus-register-password').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') modal.querySelector('#linkplus-register-submit').click();
  });

  // 聚焦邮箱输入框
  setTimeout(() => modal.querySelector('#linkplus-login-email').focus(), 50);
};

/**
 * 登录成功后处理：同步本地书签、更新 UI 状态
 */
LinkPlus.handleLoginSuccess = async function(user, closeModal) {
  LinkPlus.state.isLoggedIn = true;
  LinkPlus.state.user = user;

  closeModal();
  LinkPlus.updateAuthButton();
  LinkPlus.showToast(`欢迎回来，${user.name || user.email}！`, 'success');

  // 将本地书签同步到服务器
  LinkPlus.showToast('正在同步本地书签...', 'success');
  const syncResult = await LinkPlus.syncLocalToServer();

  if (syncResult.synced > 0) {
    LinkPlus.showToast(`已同步 ${syncResult.synced} 个书签到云端`, 'success');
  }

  // 重新从服务器加载书签
  await LinkPlus.loadBookmarks();
  LinkPlus.performSearch(LinkPlus.state.searchQuery || '');
};

/**
 * 退出登录
 */
LinkPlus.handleLogout = async function() {
  if (!confirm('确定要退出登录吗？\n\n退出后将显示本地书签数据。')) return;

  await LinkPlus.api.logout();
  LinkPlus.state.isLoggedIn = false;
  LinkPlus.state.user = null;

  LinkPlus.updateAuthButton();
  LinkPlus.showToast('已退出登录', 'success');

  // 切回本地书签
  await LinkPlus.loadBookmarks();
  LinkPlus.performSearch('');
};

/**
 * 更新底部栏的登录按钮/用户信息显示
 */
LinkPlus.updateAuthButton = function() {
  if (!LinkPlus.shadowRoot) return;
  const btn = LinkPlus.shadowRoot.getElementById('linkplus-auth-btn');
  if (!btn) return;

  if (LinkPlus.state.isLoggedIn && LinkPlus.state.user) {
    const name = LinkPlus.state.user.name || LinkPlus.state.user.email;
    btn.innerHTML = `
      <svg class="linkplus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <span>${LinkPlus.escapeHtml(name)}</span>
    `;
    btn.classList.add('logged-in');
    btn.title = '点击退出登录';
    btn.onclick = LinkPlus.handleLogout;
  } else {
    btn.innerHTML = `
      <svg class="linkplus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      <span>登录</span>
    `;
    btn.classList.remove('logged-in');
    btn.title = '登录 Link+';
    btn.onclick = LinkPlus.handleOpenAuth;
  }
};

console.log('[Link+] Auth module loaded');
