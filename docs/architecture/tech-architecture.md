# 项目技术架构介绍

## 项目定位

Paprika 是一个基于 **WXT** 框架的浏览器扩展（Chrome + Firefox），面向 AI 辅助浏览场景。核心功能是通过弹出窗口配置 API 凭证，在任意网页上以浮层形式调用 AI 能力（如内容总结、命令搜索、书签/标签页管理）。

---

## 技术栈

| 分类 | 技术 | 用途 |
|------|------|------|
| 扩展框架 | WXT 0.20.x | 浏览器扩展开发框架（React 集成） |
| UI 框架 | React 19 + TypeScript 5.9 | 组件化 UI |
| 样式 | Tailwind CSS 4 + shadcn/ui (radix-nova) | 原子化 CSS + 组件库 |
| 图标 | Lucide React | SVG 图标 |
| 表单 | react-hook-form + sonner | 表单处理 + toast 通知 |
| 命令面板 | cmdk | Cmd+K 搜索交互 |
| 底层 UI | radix-ui | 无样式可访问性原语 |
| 测试 | Vitest + jsdom + WxtVitest | 单元/集成测试 |
| 构建 | Vite (内置) | dev/build/zip |
| 包管理 | pnpm | monorepo-compatible |

---

## 项目结构

```
ai-ask/
├── Agents.md                   # 本文档
├── assets/
│   ├── tailwind.css            # Tailwind 入口 + shadcn 主题变量 + 亮暗模式
│   ├── icon.png                # 扩展图标源文件
│   └── react.svg
├── components/
│   ├── ui/                     # shadcn/ui 组件（button, command, dialog, input, item,
│   │                           #   scroll-area, separator, sonner, textarea, input-group）
│   └── ModalHeader.tsx         # 通用模态框头部（标题 + 关闭按钮）
├── entrypoints/                # WXT 入口点（核心）
│   ├── background/
│   │   └── index.ts            # Service Worker：生命周期、消息中转、快捷键、上下文菜单
│   ├── content/
│   │   ├── index.tsx           # Content Script 主入口：消息监听 + 模态框创建 + Shadow DOM
│   │   ├── Cmd.tsx             # 命令面板：标签页切换 + 书签搜索（基于 cmdk）
│   │   ├── Post.tsx            # Post 总结视图（展示帖子卡片列表）
│   │   └── Comment.tsx         # Comment 总结视图（占位）
│   ├── popup/
│   │   ├── index.html          # Popup HTML 模板（browser_action）
│   │   ├── main.tsx            # Popup React 入口
│   │   └── components/
│   │       └── CredentialForm.tsx  # API 凭证表单（URL + Key 输入）
│   └── hooks/
│       ├── useStorage.ts       # chrome.storage.local 读写封装
│       └── useFormData.ts      # 表单数据持久化（用于 popup）
├── lib/
│   └── utils.ts                # cn()：clsx + tailwind-merge
├── utils/
│   ├── constants.ts            # STORAGE_KEYS、SHORTCUTS 常量
│   └── deepseek.ts             # DeepSeek API simpleChat 调用
├── types.d.ts                  # 全局类型：IMessage<action, payload>
├── spec/
│   └── tech-architecture.md    # 早期技术架构文档
├── wxt.config.ts               # WXT 配置：Vite 插件、路径别名、manifest、commands
├── vitest.config.ts            # Vitest 配置：WxtVitest 插件、jsdom、路径别名
├── vitest.setup.ts             # 测试初始化
├── components.json             # shadcn/ui 配置（aliases、tailwind、iconLibrary）
├── .env.local                  # DeepSeek API 密钥（本地，不提交）
└── .output/                    # 构建产物（chrome-mv3-dev）
```

---

## 核心架构

### 三层架构

```
┌─────────────────────────────────────────────┐
│  Popup (browser_action)                     │
│  CredentialForm.tsx                         │
│  —— 配置 API 凭证（URL + Key）              │
│  —— 通过 useStorage 写入 chrome.storage.local│
└──────────────────┬──────────────────────────┘
                   │ 共享 chrome.storage.local
┌──────────────────▼──────────────────────────┐
│  Background Service Worker                  │
│  entrypoints/background/index.ts            │
│  —— 生命周期：onInstalled                   │
│  —— 上下文菜单：Post总结 / Comment总结       │
│  —— 快捷键：Cmd+K → 发送 palette 消息        │
│  —— 消息中转：标签页查询/切换、书签查询/打开  │
└──────────────────┬──────────────────────────┘
                   │ browser.tabs.sendMessage
                   │ browser.runtime.onMessage
┌──────────────────▼──────────────────────────┐
│  Content Script（所有页面 *://*/*）          │
│  entrypoints/content/index.tsx              │
│  —— 消息监听 → 按 action 分发               │
│  —— createModal() → Shadow DOM 浮层         │
│  —— Cmd.tsx（命令面板）                      │
│  —— Post.tsx / Comment.tsx（AI 总结视图）    │
└─────────────────────────────────────────────┘
```

### 消息通信

所有跨进程消息使用 `IMessage` 接口,项目根目录 [types.d.ts](../../types.d.ts) 

| 方向 | API | 场景 |
|------|-----|------|
| Content → Background | `browser.runtime.sendMessage` | 请求标签页/书签、切换标签页 |
| Background → Content | `browser.tabs.sendMessage` | 快捷键触发、上下文菜单 |
| Popup ↔ Storage | `chrome.storage.local` | API 凭证读写 |

异步 `sendResponse` 注意：在 background 中必须 `return true` 保持消息通道打开。

### Shadow DOM 隔离

Content Script 通过 `createShadowRootUi` + `position: 'inline'` 创建全屏遮罩模态框：

- Shadow Root 隔离样式，不受宿主页面 CSS 污染
- 打开时锁定 body 滚动（`overflow: hidden`），关闭恢复
- sonner toast 需手动注入样式到 Shadow Root
- 点击遮罩背景或 `Esc` 关闭

### 数据持久化

`useStorage<T>` hook 封装 `chrome.storage.local`，当前仅存储 API 凭证（`storageKey: 'formData'`）。

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | Chrome 开发模式 |
| `pnpm dev:firefox` | Firefox 开发模式 |
| `pnpm build` | Chrome 生产构建 |
| `pnpm build:firefox` | Firefox 生产构建 |
| `pnpm zip` | 打包为 ZIP |
| `pnpm compile` | TypeScript 类型检查 |
| `pnpm test` | 运行测试 |

开发时在 `chrome://extensions` 加载 `.output/chrome-mv3-dev` 目录。

---
