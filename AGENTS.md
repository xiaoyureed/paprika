## 基本说明

- 项目基本介绍/架构,可以在 [docs/architecture/tech-architecture.md](docs/architecture/tech-architecture.md) 中查看。
- 功能特性文档位于 `docs/spec/*.md` 

## 开发约定

1. **路径别名**：`@/` → 项目根目录（`tsconfig.json` + `wxt.config.ts` 均有配置）
2. **WXT 自动导入**：`browser`、`defineBackground`、`defineContentScript`、`createShadowRootUi` 等由框架注入，无需手动 import
3. **样式入口**：所有入口文件必须 import `@/assets/tailwind.css`
4. **生产构建**：通过 `vite-plugin-remove-console` 自动移除 `console.log`
5. **组件注册**：shadcn 组件通过 `npx shadcn add` 添加到 `components/ui/`，配置在 [components.json](components.json)
6. **代码注释**: 代码关键步骤需要添加注释, 解释为什么这样写
7. **常量**: `@/utils/constants.ts` 中定义了项目用到的常量