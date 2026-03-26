/**
 * Link+ styles.js
 * Shadow DOM 内联样式 / Inline styles for Shadow DOM
 */

/* global LinkPlus */

LinkPlus.getStyles = function() {
  return `
    /* ===== 基础重置 ===== */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* ===== 遮罩层 ===== */
    .linkplus-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 120px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      z-index: 2147483647;
      pointer-events: none;
    }

    .linkplus-overlay.active {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    /* ===== 主面板 ===== */
    .linkplus-panel {
      width: 640px;
      max-width: 90vw;
      background: rgba(30, 30, 35, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      overflow: hidden;
      transform: scale(0.95) translateY(-10px);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .linkplus-overlay.active .linkplus-panel {
      transform: scale(1) translateY(0);
    }

    /* ===== 搜索框区域 ===== */
    .linkplus-search-box {
      display: flex;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .linkplus-search-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      color: rgba(255, 255, 255, 0.5);
      flex-shrink: 0;
    }

    .linkplus-search-icon.command-mode {
      color: #10b981;
    }

    .linkplus-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-size: 16px;
      line-height: 1.5;
    }

    .linkplus-input::placeholder {
      color: rgba(255, 255, 255, 0.35);
    }

    .linkplus-shortcut-hint {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.35);
      margin-left: 12px;
      white-space: nowrap;
    }

    /* ===== 命令提示 ===== */
    .linkplus-command-hint {
      padding: 8px 20px;
      background: rgba(16, 185, 129, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 13px;
      color: #10b981;
      display: none;
    }

    .linkplus-command-hint.active {
      display: block;
    }

    /* ===== 分类标签栏 ===== */
    .linkplus-category-bar {
      display: none;
      flex-wrap: nowrap;
      overflow-x: auto;
      gap: 6px;
      padding: 8px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      scrollbar-width: none;
    }

    .linkplus-category-bar::-webkit-scrollbar {
      display: none;
    }

    .linkplus-category-bar.has-categories {
      display: flex;
    }

    .linkplus-category-tab {
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid transparent;
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .linkplus-category-tab:hover {
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.9);
    }

    .linkplus-category-tab.active {
      background: rgba(99, 102, 241, 0.25);
      border-color: rgba(99, 102, 241, 0.5);
      color: #a5b4fc;
    }

    .linkplus-category-count {
      font-size: 11px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 1px 6px;
      color: rgba(255, 255, 255, 0.5);
    }

    .linkplus-category-tab.active .linkplus-category-count {
      background: rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
    }

    /* ===== 结果列表 ===== */
    .linkplus-results {
      max-height: 400px;
      overflow-y: auto;
      padding: 8px;
    }

    .linkplus-results::-webkit-scrollbar {
      width: 6px;
    }

    .linkplus-results::-webkit-scrollbar-track {
      background: transparent;
    }

    .linkplus-results::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 3px;
    }

    .linkplus-result-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .linkplus-result-item:hover,
    .linkplus-result-item.selected {
      background: rgba(255, 255, 255, 0.08);
    }

    .linkplus-result-icon {
      width: 32px;
      height: 32px;
      min-width: 32px;
      min-height: 32px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      flex-shrink: 0;
      font-size: 14px;
      overflow: hidden;
    }

    .linkplus-favicon {
      width: 20px !important;
      height: 20px !important;
      min-width: 20px !important;
      min-height: 20px !important;
      max-width: 20px !important;
      max-height: 20px !important;
      object-fit: contain !important;
      display: block !important;
      flex-shrink: 0 !important;
    }

    .linkplus-result-content {
      flex: 1;
      min-width: 0;
    }

    .linkplus-result-title {
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .linkplus-result-url {
      color: rgba(255, 255, 255, 0.45);
      font-size: 12px;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }

    .linkplus-result-folder {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 8px;
      flex-shrink: 0;
    }

    /* ===== 编辑 & 删除按钮 ===== */
    .linkplus-edit-btn,
    .linkplus-delete-btn {
      background: transparent;
      border: none;
      padding: 6px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.15s ease, transform 0.15s ease;
      border-radius: 4px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .linkplus-edit-btn {
      margin-left: 8px;
    }

    .linkplus-delete-btn {
      margin-left: 4px;
    }

    .linkplus-edit-btn .linkplus-icon {
      width: 14px;
      height: 14px;
      color: rgba(59, 130, 246, 0.8);
    }

    .linkplus-delete-btn .linkplus-icon {
      width: 14px;
      height: 14px;
      color: rgba(239, 68, 68, 0.8);
    }

    .linkplus-result-item:hover .linkplus-edit-btn,
    .linkplus-result-item:hover .linkplus-delete-btn {
      opacity: 1;
    }

    .linkplus-edit-btn:hover {
      background: rgba(59, 130, 246, 0.2);
      transform: scale(1.1);
    }

    .linkplus-edit-btn:hover .linkplus-icon {
      color: rgba(59, 130, 246, 1);
    }

    .linkplus-delete-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      transform: scale(1.1);
    }

    .linkplus-delete-btn:hover .linkplus-icon {
      color: rgba(239, 68, 68, 1);
    }

    .linkplus-edit-btn:active,
    .linkplus-delete-btn:active {
      transform: scale(0.95);
    }

    /* ===== 空状态 ===== */
    .linkplus-empty {
      padding: 40px 20px;
      text-align: center;
      color: rgba(255, 255, 255, 0.4);
      font-size: 14px;
    }

    .linkplus-empty-icon {
      font-size: 32px;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    /* ===== 底部栏 ===== */
    .linkplus-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 12px;
      color: rgba(255, 255, 255, 0.35);
    }

    .linkplus-footer-hint {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .linkplus-footer-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .linkplus-key {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-family: 'SF Mono', Monaco, monospace;
    }

    .linkplus-footer-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s ease;
      border: 1px solid transparent;
      background: transparent;
      color: rgba(255, 255, 255, 0.5);
      white-space: nowrap;
    }

    .linkplus-footer-btn .linkplus-icon {
      width: 12px;
      height: 12px;
      flex-shrink: 0;
    }

    .linkplus-footer-btn span {
      white-space: nowrap;
    }

    .linkplus-footer-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
    }

    .linkplus-footer-btn:active {
      transform: scale(0.95);
    }

    .linkplus-footer-auth:hover {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.3);
      color: rgba(99, 102, 241, 0.9);
    }

    .linkplus-footer-auth.logged-in {
      color: #10b981;
    }

    .linkplus-footer-auth.logged-in:hover {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.3);
      color: #10b981;
    }

    .linkplus-footer-tutorial:hover {
      background: rgba(59, 130, 246, 0.15);
      border-color: rgba(59, 130, 246, 0.3);
      color: rgba(59, 130, 246, 0.9);
    }

    .linkplus-footer-settings:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
    }

    .linkplus-footer-clear:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.3);
      color: rgba(239, 68, 68, 0.9);
    }

    /* ===== Toast 通知 ===== */
    .linkplus-toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    }

    .linkplus-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(30, 30, 35, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
      color: #fff;
      font-size: 14px;
      transform: translateX(120%);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
      max-width: 320px;
      pointer-events: auto;
    }

    .linkplus-toast.show {
      transform: translateX(0);
      opacity: 1;
    }

    .linkplus-toast-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .linkplus-toast.success .linkplus-toast-icon {
      color: #10b981;
    }

    .linkplus-toast.error .linkplus-toast-icon {
      color: #ef4444;
    }

    .linkplus-toast-message {
      flex: 1;
    }

    /* ===== 教程弹窗 ===== */
    .linkplus-tutorial-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      pointer-events: auto;
    }

    .linkplus-tutorial-content {
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      background: rgba(30, 30, 35, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .linkplus-tutorial-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .linkplus-tutorial-header h2 {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .linkplus-tutorial-close {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .linkplus-tutorial-close:hover {
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.1);
    }

    .linkplus-tutorial-body {
      padding: 20px;
      overflow-y: auto;
      color: rgba(255, 255, 255, 0.85);
      font-size: 14px;
      line-height: 1.6;
    }

    .linkplus-tutorial-body section {
      margin-bottom: 20px;
    }

    .linkplus-tutorial-body h3 {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .linkplus-tutorial-body h4 {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 500;
      margin: 12px 0 8px;
    }

    .linkplus-tutorial-body ul,
    .linkplus-tutorial-body ol {
      margin: 8px 0;
      padding-left: 20px;
    }

    .linkplus-tutorial-body li {
      margin: 6px 0;
    }

    .linkplus-tutorial-body kbd {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
    }

    .linkplus-tutorial-body code {
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 13px;
      color: #10b981;
    }

    .linkplus-tutorial-method {
      background: rgba(255, 255, 255, 0.03);
      padding: 12px;
      border-radius: 8px;
      margin: 8px 0;
    }

    .linkplus-tutorial-examples,
    .linkplus-tutorial-tips {
      margin-top: 12px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }

    .linkplus-tutorial-examples p,
    .linkplus-tutorial-tips p {
      margin: 0 0 8px;
      color: rgba(255, 255, 255, 0.7);
    }

    /* ===== 登录/注册弹窗 ===== */
    .linkplus-auth-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      pointer-events: auto;
    }

    .linkplus-auth-content {
      width: 400px;
      max-width: 90vw;
      background: rgba(30, 30, 35, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    .linkplus-auth-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .linkplus-auth-title {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    .linkplus-auth-close {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .linkplus-auth-close:hover {
      color: rgba(255, 255, 255, 0.9);
      background: rgba(255, 255, 255, 0.1);
    }

    .linkplus-auth-tabs {
      display: flex;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .linkplus-auth-tab {
      flex: 1;
      padding: 12px;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.5);
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s ease;
      border-bottom: 2px solid transparent;
    }

    .linkplus-auth-tab:hover {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.05);
    }

    .linkplus-auth-tab.active {
      color: #fff;
      border-bottom-color: #6366f1;
    }

    .linkplus-auth-form {
      padding: 20px;
    }

    .linkplus-auth-field {
      margin-bottom: 16px;
    }

    .linkplus-auth-field label {
      display: block;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 6px;
    }

    .linkplus-auth-field input {
      width: 100%;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .linkplus-auth-field input:focus {
      border-color: rgba(99, 102, 241, 0.6);
    }

    .linkplus-auth-field input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .linkplus-auth-error {
      min-height: 18px;
      font-size: 13px;
      color: #f87171;
      margin-bottom: 12px;
    }

    .linkplus-auth-submit {
      width: 100%;
      padding: 11px;
      background: #6366f1;
      border: none;
      border-radius: 8px;
      color: #fff;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .linkplus-auth-submit:hover {
      background: #5254cc;
    }

    .linkplus-auth-submit:active {
      transform: scale(0.98);
    }

    .linkplus-auth-submit:disabled {
      background: rgba(99, 102, 241, 0.5);
      cursor: not-allowed;
    }

    .linkplus-auth-tip {
      text-align: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.3);
      padding: 0 20px 16px;
      margin: 0;
    }
  `;
};