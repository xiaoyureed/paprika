# 暗黑模式

## 功能描述

在 Options 页面和 Content Script 浮层中支持暗黑模式，跟随操作系统 `prefers-color-scheme` 自动切换，无需用户手动配置。

## 技术原理

- Tailwind v4 通过 `@custom-variant dark (&:is(.dark *))` 定义暗黑 variant，`.dark` class 的祖先元素触发 dark 样式
- `assets/tailwind.css` 已定义 `.dark { ... }` CSS 变量块（background、foreground、card 等）
- 所有 shadcn 组件通过 `--background` / `--foreground` 等 CSS 自定义属性取色，自动响应变量变化
- Options 页面使用 `next-themes` 管理 `<html>` 上的 `.dark` class
- Content Script 浮层（Shadow DOM）独立管理 `.dark` class

## 实现方案

### Options 页面

使用 `next-themes` 的 `ThemeProvider` 包裹根组件：

| 配置 | 值 | 说明 |
|------|-----|------|
| `attribute` | `"class"` | 在 `<html>` 上添加 `.dark` class |
| `defaultTheme` | `"system"` | 跟随操作系统 |
| `enableSystem` | `true` | 启用系统主题检测 |
| `disableTransitionOnChange` | `true` | 避免主题切换时 CSS transition 闪烁 |

`ThemeProvider` 内部会监听 `window.matchMedia('(prefers-color-scheme: dark)')` 的 `change` 事件，自动 toggle `.dark` class。

### Content Script 主浮层

Shadow DOM 与宿主页面 CSS 隔离，宿主 `<html>` 上的 `.dark` 不会透传。需要在 Shadow DOM 根容器上手动管理 `.dark`：

1. `onMount` 中创建 `root` div 后，检测 `window.matchMedia('(prefers-color-scheme: dark)').matches`
   - `true` → `root.classList.add('dark')`
   - `false` → 不做操作（浅色为默认）
2. 监听 `change` 事件实时切换 `.dark`
3. `onRemove` 清理中移除事件监听

### Content Script 提示词选择面板

与主浮层相同的 Shadow DOM 隔离处理：

1. `onMount` 中创建 `root` div 后，相同的 `matchMedia` + `.dark` class 切换逻辑
2. `cleanups` 数组中添加事件监听移除

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `entrypoints/options/main.tsx` | 修改 | 添加 ThemeProvider 包裹 |
| `entrypoints/content/createUI.tsx` | 修改 | Shadow DOM 暗黑模式切换 |
| `entrypoints/content/prompt/createPromptSelectorUI.tsx` | 修改 | Shadow DOM 暗黑模式切换 |
| `docs/spec/004-dark-mode.md` | 新建 | 本文档 |

## 验证场景

1. Options 页面：系统切换到暗黑模式 → 页面背景/文字/卡片/按钮/弹窗全部切换为暗色
2. Options 页面：系统切回浅色模式 → 页面恢复浅色
3. Content Script 浮层（Post/Command）：OS 暗黑模式下触发 → 浮层暗色渲染
4. Content Script 提示词选择面板：OS 暗黑模式下输入 `/t` → 面板暗色
5. 实时切换：Content Script 浮层打开时切换 OS 主题 → 浮层实时跟随
6. 浅色模式下外观不变：无回归
