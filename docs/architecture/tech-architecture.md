# 项目架构说明文档


## 三层架构

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

## 消息通信

所有跨进程消息使用 `IMessage` 接口,项目根目录 [types.d.ts](../../types.d.ts) 

| 方向 | API | 场景 |
|------|-----|------|
| Content → Background | `browser.runtime.sendMessage` | 请求标签页/书签、切换标签页 |
| Background → Content | `browser.tabs.sendMessage` | 快捷键触发、上下文菜单 |
| Popup ↔ Storage | `chrome.storage.local` | API 凭证读写 |

异步 `sendResponse` 注意：在 background 中必须 `return true` 保持消息通道打开。

## Shadow DOM 隔离

Content Script 通过 `createShadowRootUi` + `position: 'inline'` 创建全屏遮罩模态框：

- Shadow Root 隔离样式，不受宿主页面 CSS 污染
- 打开时锁定 body 滚动（`overflow: hidden`），关闭恢复
- sonner toast 需手动注入样式到 Shadow Root
- 点击遮罩背景或 `Esc` 关闭

## 数据持久化

`useStorage<T>` hook 封装 `chrome.storage.local`，当前仅存储 API 凭证（`storageKey: 'formData'`）。
