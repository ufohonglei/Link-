<img width="2048" height="2048" alt="Gemini_Generated_Image_wtfk51wtfk51wtfk" src="https://github.com/user-attachments/assets/3b93f4c6-4da4-4eab-83f0-4cbeb5ef7731" />


# Link+ - 极简高效的浏览器书签管理工具

Link+ 是一个基于 Chrome Extension Manifest V3 开发的浏览器插件，采用类似 Raycast 的交互逻辑，提供极简、高效的网页书签管理体验。

<img width="1715" height="986" alt="image" src="https://github.com/user-attachments/assets/cc578e70-fab6-499b-987e-80946901ceb6" />



## ✨ 核心特性

- **🚀 快速唤起** - `Alt + Q` 快捷键瞬间打开搜索面板
- **🔍 模糊搜索** - 基于 Fuse.js 的智能模糊匹配，支持拼写容错
- **⚡ 一键保存** - `Alt + W` 快速保存当前页面
- **🏷️ 标签归类** - 支持 `#标签` 语法自动归类到子文件夹
- **🎨 精美 UI** - 暗色主题 + 毛玻璃效果，视觉体验极佳
- **🔒 样式隔离** - Shadow DOM 技术确保与网页零冲突

## 📦 安装方法

### 方式一：开发者模式加载（推荐）

1. 下载本项目代码到本地
2. 打开 Chrome 浏览器，地址栏输入 `chrome://extensions/`
3. 开启右上角"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹完成安装

### 方式二：Chrome 应用商店（待上架）

> 即将上架 Chrome Web Store，敬请期待

## ⌨️ 快捷键

| 功能 | Windows/Linux | Mac |
|------|---------------|-----|
| 打开/关闭搜索框 | `Alt + Q` | `Cmd + Shift + P` |
| 快速保存当前页 | `Alt + W` | `Cmd + Shift + S` |

> 快捷键可在 `chrome://extensions/shortcuts` 中自定义

## 📖 使用指南

### 🔍 搜索书签

1. 按 `Alt + Q` 打开搜索面板
2. 输入关键词进行模糊搜索
3. 使用 `↑↓` 方向键选择书签
4. 按 `Enter` 在当前页打开
5. 按 `Ctrl/Cmd + Enter` 在新标签页打开
6. 按 `ESC` 关闭搜索框

### 💾 保存书签

#### 方式一：快速保存
- 按 `Alt + W` 直接将当前页面保存到"未分类"文件夹

#### 方式二：命令模式保存
1. 按 `Alt + Q` 打开搜索框
2. 输入 `+ 标题 #标签`（例如：`+ 常用文档 #工作`）
3. 按 `Enter` 保存
4. 使用 `#标签` 会自动创建子文件夹并归类

### 🗑️ 删除书签

- **单个删除**：鼠标悬停在书签上，点击右侧出现的 🗑️ 图标
- **全部清空**：点击底部栏"清空"按钮，确认后删除所有收藏

### 🖱️ 右键菜单

在任意网页右键，选择"✨ 一键存入 QuickLink"：
- 📁 保存到"未分类"
- 💼 保存到"工作"
- 📚 保存到"学习"
- 📖 保存到"稍后阅读"

## 🏗️ 项目结构

```
Link+/
├── manifest.json          # 插件配置（Manifest V3）
├── background.js          # 后台脚本（Service Worker）
├── content/
│   ├── inject.js          # 内容脚本（Shadow DOM 注入）
│   └── style.css          # 样式文件（备用）
├── lib/
│   └── fuse.js            # Fuse.js 模糊搜索库
├── icons/
│   ├── icon16.png         # 16x16 图标
│   ├── icon32.png         # 32x32 图标
│   ├── icon48.png         # 48x48 图标
│   └── icon128.png        # 128x128 图标
└── README.md              # 项目说明
```

## 🛠️ 技术栈

- **Manifest V3** - Chrome 扩展最新规范
- **Shadow DOM** - 样式隔离，零污染
- **Fuse.js** - 轻量级模糊搜索库
- **原生 JavaScript** - 无框架依赖，极致性能

## 🔧 开发计划

- [ ] 书签编辑功能
- [ ] 导入/导出书签
- [ ] 云同步支持
- [ ] 自定义主题
- [ ] 更多快捷键配置

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源。

## 👤 作者联系

如有问题或建议，欢迎联系作者：

- 💬 微信：lihonglei

## ☕ 支持项目

如果这个项目对你有帮助，可以请作者喝杯咖啡：

| 微信赞赏  |
|---------|
![f4728f4ae297b7793e8068c52d9fba70](https://github.com/user-attachments/assets/615c513f-3a49-4a96-b23e-6eea55e485bd)

> 您的支持是我持续开发的动力！❤️

## 🙏 致谢

- [Fuse.js](https://fusejs.io/) - 强大的模糊搜索库
- [Feather Icons](https://feathericons.com/) - 优雅的 SVG 图标

---

Made with ❤️ by Link+ Team
