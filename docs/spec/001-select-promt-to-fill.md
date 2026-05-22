# 选择提示词模板填充到页面输入框

## 功能描述

用户在任何页面的文本输入框（`<textarea>` / `<input type="text|search|url|email">`）中输入 `/t` 时，在输入框附近浮动显示一个搜索式提示词选择面板。用户可选择已有的提示词模板，将其内容直接插入到光标位置，同时自动移除 `/t` 前缀。

## 交互流程

```
用户输入 /t ──→ 浮动面板出现 ──→ 搜索/浏览提示词 ──→ 点击选中 ──→ /t 被替换为提示词内容
                                      │
                                      ├── 点击外部 / Escape ──→ 面板关闭，/t 保留
                                      └── 无匹配 ──→ 显示"无匹配提示词"
```

## 触发规则

- **触发前缀**：`/t`
- **匹配条件**：`/t` 必须出现在词边界（行首、或前面是空白字符），后面为空白字符或行尾
- **正则**：`/(?:^|\s)(\/t)(?=\s|$)/`
- **排除场景**：不会匹配单词中的 `/t`（如 `that`、`not/t`）
- **重复触发**：面板已打开时不再重复创建

## UI 规格

- **面板风格**：浮动卡片，圆角 + 阴影，位于输入框下方（空间不足时上方）
- **尺寸**：宽 360px，最大高 280px
- **组件**：基于 cmdk / `Command` 组件构建，自带模糊搜索
- **搜索范围**：提示词的名称、内容、标签
- **空状态**：无匹配时显示"无匹配提示词"

## 技术实现

- `useTriggerDetector.ts`：事件委托监听 document 的 input 事件，检测触发条件
- `PromptSelector.tsx`：搜索选择面板 UI 组件
- `createPromptSelectorUI.ts`：通过 `createShadowRootUi` 创建隔离 Shadow DOM，处理定位、文本插入、面板生命周期
- 提示词数据直接从 `chrome.storage.local` 读取，不经过 background 中转

## 插入行为

1. 找到 `/t` 在 input value 中的索引（matchIndex）
2. 构造新值：`value.slice(0, matchIndex) + 提示词内容 + value.slice(matchIndex + 2)`
3. 设置 cursor 到插入内容末尾
4. 派发原生 `input` 事件，触发宿主页面框架响应

## 边界与约束

- 仅支持原生 `<textarea>` 和 `input[type=text|search|url|email]`，不支持 `contenteditable`
- 面板使用 `position: fixed` 定位，页面滚动时面板位置不变（超出视口则不可见）
- 提示词列表在面板打开时从 storage 读取，不实时监听 storage 变化
- 样式通过 Shadow DOM 隔离，不受宿主页面影响



## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `entrypoints/content/useTriggerDetector.ts` | 新建 | 事件委托监听 document input 事件，检测 `/t` 词边界触发 |
| `entrypoints/content/PromptSelector.tsx` | 新建 | 基于 cmdk 的搜索选择面板 UI 组件 |
| `entrypoints/content/createPromptSelectorUI.tsx` | 新建 | Shadow DOM 生命周期管理，含定位计算、文本插入、点击外部 / Escape 关闭 |
| `entrypoints/content/index.tsx` | 修改 | 在 `main()` 中集成触发检测，与现有消息分发并行 |
| `docs/spec/001-select-promt-to-fill.md` | 修改 | 本文档 |

## 核心交互流

1. 在页面任意 `<textarea>` / `<input>` 中，于词边界输入 `/t`（如行首、空格后）
2. 输入框下方（空间不足时上方）浮现 360px 宽的浮动搜索面板
3. 搜索框自动聚焦，输入内容实时过滤提示词名称/内容/标签
4. 点击任一提示词 → `/t` 被替换为提示词内容，光标定位到内容末尾
5. 点击面板外部 / Escape → 面板关闭，`/t` 保持不动
6. 面板显示期间不重复创建

## 验证场景

- 在 `textarea` 和 `input[type=text]` 中分别输入 `/t` → 面板正常弹出
- 在输入框中输入包含 `/t` 的单词（如 `that`, `not/t`）→ 面板不弹出
- 在输入框已有文字后输入 ` /t `（空格分隔）→ 面板弹出
- 选中提示词后，`/t` 被替换为提示词内容，光标定位到内容末尾
- 点击面板外部 / 按 Escape → 面板关闭，`/t` 保留
- 面板打开时再次输入 `/t` → 不重复创建
