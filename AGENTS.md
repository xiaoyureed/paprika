# 项目介绍

## 项目定位

Paprika 是一个基于 **WXT** 框架的浏览器扩展（Chrome + Firefox），面向 AI 辅助浏览场景。核心功能是通过弹出窗口配置 API 凭证，在任意网页上以浮层形式调用 AI 能力（如内容总结、命令搜索、书签/标签页管理）。


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


## 文档说明

- 项目架构详细介绍,可以在 [docs/architecture/tech-architecture.md](docs/architecture/tech-architecture.md) 中查看。
- 功能规格文档位于 `docs/spec/*.md` , 后续添加的功能规格文档也应该在该目录下, 命名规则为 `{编号}-{功能名称}.md` 。

## 开发约定

1. **路径别名**：`@/` → 项目根目录（`tsconfig.json` + `wxt.config.ts` 均有配置）
1. **WXT 自动导入**：`browser`、`defineBackground`、`defineContentScript`、`createShadowRootUi` 等由框架注入，无需手动 import
1. **样式入口**：所有入口文件必须 import `@/assets/tailwind.css`
1. **组件注册**：shadcn 组件通过 `npx shadcn add` 添加到 `components/ui/`，配置在 [components.json](components.json)
1. **代码注释**: 代码关键步骤需要添加注释，解释why, 而不是 what/how
1. **常量**: `@/utils/constants.ts` 中定义了项目用到的常量


## 项目结构

```
ai-ask/
├── AGENTS.md                   # 本文档
├── assets/
│   ├── tailwind.css            # Tailwind 入口 + shadcn 主题变量 + 亮暗模式
│   ├── icon.png                # 扩展图标源文件
├── components/
│   ├── ui/                     # shadcn/ui 组件（button, command, dialog, input, item,
│   │                           #   scroll-area, separator, sonner, textarea, input-group）
│   └── ModalHeader.tsx         # 通用模态框头部（标题 + 关闭按钮）
├── entrypoints/                # WXT 入口点（核心）
│   ├── background/
│   │   └── index.ts            # Service Worker：生命周期、消息中转、快捷键、上下文菜单
│   ├── content/
│   │   ├── index.tsx           # Content Script 主入口：消息监听 + 模态框创建 + Shadow DOM
│   │   ├── Palette.tsx         # 命令面板：标签页切换 + 书签搜索（基于 cmdk）
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
├── types.d.ts                  # 全局类型
├── docs/spec/                  # 项目规格文档
├── wxt.config.ts               # WXT 配置：Vite 插件、路径别名、manifest、commands
├── vitest.config.ts            # Vitest 配置：WxtVitest 插件、jsdom、路径别名
├── vitest.setup.ts             # 测试初始化
├── components.json             # shadcn/ui 配置（aliases、tailwind、iconLibrary）
├── .env.local                  # DeepSeek API 密钥（本地，不提交）
└── .output/                    # 构建产物（chrome-mv3-dev）
```


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

