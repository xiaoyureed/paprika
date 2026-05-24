# 提示词导入/导出

## 功能描述

在提示词管理页面提供导入/导出功能，用户可将全部提示词导出为 JSON 文件备份或迁移，也可以从 JSON 文件将提示词批量导入到当前列表（追加模式，不覆盖已有提示词）。

## 数据格式

导出和导入使用统一的 JSON 格式，带 `version` 字段以备未来格式演进：

```json
{
  "version": 1,
  "prompts": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "总结文章",
      "content": "请用中文总结以下内容：",
      "tags": ["总结", "中文"],
      "createdAt": 1712345678000,
      "updatedAt": 1712345678000
    }
  ]
}
```

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `version` | number | 是 | 格式版本号，当前为 `1` |
| `prompts` | array | 是 | 提示词列表 |
| `prompts[].id` | string | 否 | 导出时保留，导入时重新生成 |
| `prompts[].name` | string | 是 | 提示词名称 |
| `prompts[].content` | string | 是 | 提示词内容 |
| `prompts[].tags` | string[] | 否 | 标签列表 |
| `prompts[].createdAt` | number | 否 | 创建时间戳（ms），导入时覆盖为当前时间 |
| `prompts[].updatedAt` | number | 否 | 更新时间戳（ms），导入时覆盖为当前时间 |

## 交互流程

### 导出

```
用户点击"导出"按钮
  └── 序列化全部 prompts 为 JSON
      └── 浏览器下载 paprika-prompts-{yyyy-MM-dd}.json
```

### 导入

```
用户点击"导入"按钮
  └── 弹出系统文件选择器（过滤 .json）
      ├── 用户取消 → 无操作
      └── 用户选择文件
          ├── 读取文件内容
          │   ├── 非法 JSON → toast 错误，中止
          │   ├── 缺少 version 或 version 不是数字 → toast 错误，中止
          │   ├── prompts 不是数组 → toast 错误，中止
          │   ├── 某条提示词缺少 name/content → toast 错误，中止
          │   └── 校验通过
          └── 逐条追加到当前列表
              ├── 重新生成 id（crypto.randomUUID()）
              ├── 重置 createdAt / updatedAt 为当前时间
              └── toast 成功："成功导入 N 个提示词"
```

## UI 规格

- **位置**：顶栏、"新建提示词"按钮左侧
- **按钮**：文本按钮（"导入" / "导出"），使用 `Download` / `Upload` 图标
- **文件选择器**：隐藏的 `<input type="file" accept=".json">`，点击导入按钮触发
- **导出文件名**：`paprika-prompts-{yyyy-MM-dd}.json`
- **反馈**：全部通过 sonner toast 通知（成功/错误）

## 校验规则

导入文件按顺序校验，任一条件不满足则中止并 toast 报错：

1. 文件内容不是合法 JSON → "文件格式不正确，请选择有效的 JSON 文件"
2. `version` 字段不存在或不是数字 → "无法识别文件格式"
3. `prompts` 不是数组 → "文件中没有可导入的提示词"
4. 数组中某个元素缺少 `name` 或 `content` → "第 N 个提示词缺少名称或内容"
5. `prompts` 为空数组 → "文件中没有提示词"

## 边界与约束

- 导入始终是追加模式，不会删除或覆盖已有提示词
- 导入时重新生成所有 ID，避免与现有提示词 ID 冲突
- 多次导入同一文件会产生重复提示词（同名、同内容），不判重
- 导出文件不包含敏感信息（API Key 等凭据独立存储）
- 使用浏览器原生 `<a download>` 机制导出，不需要额外权限
- 导入数量没有上限校验，性能由 browser.storage.local 容量限制决定（通常 5-10MB）

## 文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `entrypoints/options/components/PromptManager.tsx` | 修改 | 添加导入/导出按钮及交互逻辑 |
| `docs/spec/003-prompt-import-export.md` | 新建 | 本文档 |

## 验证场景

1. 点击导出 → 下载 `paprika-prompts-{date}.json`，内容为合法的带 version JSON
2. 导入合法文件 → 提示词追加到列表，ID 重新生成，toast 显示导入数量
3. 导入空的 JSON 对象 → toast 报错，列表不变
4. 导入不含 `name` 字段的数据 → toast 报错"缺少名称"，列表不变
5. 导入已存在的同名提示词 → 列表中同时存在两条同名提示词
6. 取消文件选择器 → 无任何操作
7. 导入非 JSON 文件（如 .txt）→ toast 报错，列表不变
