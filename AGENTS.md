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
1. **组件注册**：shadcn 组件通过 `npx shadcn add` 添加到 `components/ui/`，配置在 [components.json](components.json)
1. **代码注释**: **代码关键步骤要添加注释, 解释做了什么, 以及为什么这样做**.【非常重要】
1. **常量**: 在 `@/utils/constants.ts` 中定义项目用到的常量
1. **类型文件**: 需要频繁在不同文件中使用的类型, 定义在 `@/types.d.ts` 中, 从而避免在每个文件中频繁导入类型


