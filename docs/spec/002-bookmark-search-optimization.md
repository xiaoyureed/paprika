# 书签搜索性能优化

## 问题背景

当前书签功能在 Palette（命令面板）中采用全量预加载模式：

1. 面板挂载时发送 `get-bookmarks` 到 background
2. background 调用 `browser.bookmarks.getTree()` 遍历整棵树并拍平
3. 全部书签一次性渲染到 cmdk 的 `CommandGroup` 中
4. 用户搜索时由 cmdk 在客户端对全部 DOM 节点做过滤

用户书签数量较大时，数据加载、DOM 渲染、搜索过滤三个阶段均出现性能瓶颈。

## 优化方案

核心思路：**放弃全量预加载，改用按需搜索**。借助 `browser.bookmarks.search()` API 做服务端搜索，仅在结果超过阈值时引入虚拟滚动；结果较少时沿用 cmdk 原生渲染，避免集成复杂度。

## 交互流程

```
面板打开 ──→ 加载最近 10 条书签（bookmarks.getRecent(10)）
                │
         用户在 CommandInput 中输入
                │
          300ms 防抖
                │
    ┌──── 发送 palette-typing 到 background ────┐
    │                                              │
    │   空查询 → bookmarks.getRecent(10)          │
    │   非空查询 → bookmarks.search(query)        │
    │   过滤掉文件夹节点                            │
    │   返回 { results, totalCount, seq }          │
    └──────────────┬───────────────────────────────┘
                   │
          results ≤ 50  → cmdk 原生 CommandGroup 渲染
          results > 50  → TanStack Virtual 虚拟滚动
```

## 触发规则

- **初次加载**：面板挂载后发送空查询（`query: ''`），background 返回 `getRecent(10)` 的结果
- **用户输入**：每次 `CommandInput` 值变化时触发，经 300ms 防抖后发出
- **面板关闭重开**：重新挂载时清空旧状态，走初次加载流程

## 具体实现

### 1. 新增依赖

```
@tanstack/react-virtual
```

### 2. 常量新增

`utils/constants.ts` 中新增：

```typescript
/** 超过此阈值启用虚拟滚动，否则使用 cmdk 原生列表 */
export const BOOKMARK_VIRTUAL_THRESHOLD = 50
/** 搜索防抖延迟（ms） */
export const BOOKMARK_SEARCH_DEBOUNCE = 300
/** 虚拟滚动 overscan 行数 */
export const BOOKMARK_VIRTUAL_OVERSCAN = 10
```

### 3. 类型变更

`types.d.ts` 的 `IMessage.action` 增加 `'palette-typing'`：

```typescript
interface IMessage<T = any> {
  action:
    | 'post'
    | 'comment'
    | 'open-side-bar'
    | 'palette'
    | 'get-tabs'
    | 'switch-tab'
    | 'get-bookmarks'
    | 'open-bookmark'
    | 'openOptionsPage'
    | 'palette-typing'   // 新增
  payload?: T
}

/** palette-typing 消息的 payload 结构 */
interface PaletteTypingPayload {
  query: string
  seq: number   // 请求序号，用于客户端丢弃过期响应
}

/** palette-typing 的响应结构 */
interface PaletteTypingResponse {
  results: IBookmark[]
  totalCount: number
  seq: number   // 回传请求序号，客户端校验
}
```

### 4. Background 新增 `palette-typing` 处理器

`entrypoints/background/index.ts` 中新增消息处理分支：

```typescript
else if (message.action === 'palette-typing') {
  const { query, seq } = message.payload as PaletteTypingPayload

  if (!query || query.trim() === '') {
    browser.bookmarks.getRecent(10).then((recent) => {
      const results: IBookmark[] = recent
        .filter((item) => item.url)
        .map((item) => ({
          id: parseInt(item.id, 10),
          title: item.title || 'Untitled',
          url: item.url!,
          path: '',
        }))
      sendResponse({ results, totalCount: results.length, seq })
    })
  } else {
    browser.bookmarks.search(query).then((items) => {
      const results: IBookmark[] = items
        .filter((item) => item.url)
        .map((item) => ({
          id: parseInt(item.id, 10),
          title: item.title || 'Untitled',
          url: item.url!,
          path: '',
        }))
      sendResponse({ results, totalCount: results.length, seq })
    })
  }

  return true // 保持异步通道
}
```

### 5. Palette 搜索逻辑重写

`entrypoints/content/Palette.tsx`：

#### 5.1 请求竞态控制

通过递增 `seq` 序号解决并发请求的响应顺序问题：

```typescript
const seqRef = useRef(0)

const searchBookmarks = useCallback((query: string) => {
  const currentSeq = ++seqRef.current
  browser.runtime.sendMessage(
    { action: 'palette-typing', payload: { query, seq: currentSeq } },
    (response: PaletteTypingResponse) => {
      // 丢弃序号不匹配的过期响应
      if (response.seq !== currentSeq) return
      setBookmarks(response.results)
      setTotalCount(response.totalCount)
      setSearching(false)
    }
  )
}, [])
```

#### 5.2 防抖 hook

自建 `useDebouncedCallback`，无需额外依赖：

```typescript
function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  return useCallback(
    (...args: Args) => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => callbackRef.current(...args), delay)
    },
    [delay],
  )
}
```

注意：debounced 函数没有返回值（void），类型签名体现这一点而非返回 `T`。

#### 5.3 cmdk 配置

- `<Command shouldFilter={false}>`：禁用 cmdk 内置客户端过滤，完全由外部搜索结果驱动
- `<CommandInput onValueChange={debouncedSearch}>`：监听输入变化

#### 5.4 渲染策略

根据 `results.length` 与 `BOOKMARK_VIRTUAL_THRESHOLD` 的比较，选择渲染模式：

**模式 A：cmdk 原生列表**（`results.length ≤ 50`）

直接使用 `CommandGroup` + `CommandItem` 渲染全部结果，保留 cmdk 完整的键盘导航能力。

**模式 B：TanStack Virtual 虚拟滚动**（`results.length > 50`）

在 `CommandList` 内部使用 `useVirtualizer` 创建虚拟滚动容器：

```typescript
const virtualizer = useVirtualizer({
  count: bookmarks.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 36,   // 每项约 36px
  overscan: BOOKMARK_VIRTUAL_OVERSCAN,
})
```

关键集成点：

- 通过 ref 获取 `CommandList` 内部的滚动容器 DOM 节点，传给 `getScrollElement`
- 虚拟列表的每一项仍包裹在 `<CommandItem>` 中，以复用 cmdk 的 hover/select 样式
- **键盘导航受限**：cmdk 的原生上下键导航无法感知虚拟化后未渲染的 DOM 节点，因此超出 overscan 范围的项无法通过键盘访问。这是已知权衡：结果数 >50 时优先保证渲染性能，键盘导航覆盖 visible+overscan（约 20 项），用户可通过继续输入缩小结果范围

#### 5.5 状态管理

```typescript
const [bookmarks, setBookmarks] = useState<IBookmark[]>([])
const [totalCount, setTotalCount] = useState(0)
const [searching, setSearching] = useState(false)
```

状态流转：

- 面板挂载 → `searching = true` → 发空查询 → 收到响应 → `searching = false`，渲染结果
- 用户输入 → `searching = true` → 300ms 防抖 → 发查询 → 收到匹配序号的响应 → `searching = false`
- 面板卸载 → 所有状态自然销毁，下次挂载重新走"初次加载"

#### 5.6 加载与错误状态

- **加载中**：`searching === true` 时，在书签分组 heading 旁显示一个小的加载指示器（如 spinning loader icon），`CommandEmpty` 不显示以避免闪烁
- **空结果**：`searching === false && bookmarks.length === 0` 时，显示 `CommandEmpty` 提示"无匹配书签"
- **API 错误**：`browser.runtime.lastError` 非空时，`searching = false`，显示 `CommandEmpty` 提示"搜索失败"，不崩溃

## 边界与约束

- **"最近添加" vs "最近使用"**：`bookmarks.getRecent(10)` 只能获取最近*添加*的书签。如果后续需要"最近使用"，需要额外维护访问记录存储
- **虚拟滚动模式下的键盘导航**：结果 >50 时启用虚拟滚动，cmdk 键盘导航仅覆盖 visible + overscan 范围的项。这是性能与导航体验的权衡——用户可通过缩小搜索范围让目标项出现在可导航区域内。结果 ≤50 时不启用虚拟滚动，键盘导航完整
- **空查询展示**：空查询时用 `getRecent(10)` 返回最近添加的 ≤10 条书签，不做排序或分组
- **文件夹不展示**：搜索结果过滤掉文件夹（`item.url` 为空），只展示实际书签
- **竞态控制**：通过 seq 序号确保只有最新请求的响应会被应用到 UI，旧请求的响应自动丢弃

## 验证场景

- 打开命令面板（Cmd+I），书签区域默认展示最近添加的 ≤10 条书签
  - 验证：面板打开后书签区域有数据且不超过 10 条
- 输入关键词搜索，确认 300ms 防抖后发起搜索，结果正确显示
  - 验证：输入后等待 300ms，搜索结果与关键词匹配
- 快速连续输入不同关键词，确认只展示最后一次搜索的结果
  - 验证：快速键入 "goo" → 立即删除并键入 "git"，确认最终只显示 "git" 的结果，无中间状态残留
- 搜索无匹配关键词，确认显示空状态
  - 验证：输入不存在的关键词，显示"无匹配"提示
- 搜索结果 ≤50 条，确认使用原生 cmdk 列表，键盘上下键可完整导航
  - 验证：检查 DOM 中所有书签项都已渲染，键盘可遍历全部结果
- 搜索结果 >50 条，确认启用虚拟滚动
  - 验证：检查 DOM 中实际渲染的书签项数量远小于 totalCount
- 点击书签项，正确在新标签页打开对应 URL
  - 验证：点击后新标签页打开，URL 正确
- 清空搜索框，确认展示最近 10 条书签（而非上次搜索结果）
  - 验证：删除搜索词后→展示最近 10 条
- 关闭面板后重新打开，确认重新加载最近 10 条（不残留上次搜索）
  - 验证：搜索 "git" → 选择书签（面板关闭）→ Cmd+I 重新打开 → 确认展示最近 10 条而非 "git" 的结果
- 搜索过程中显示加载指示器，不闪烁空状态
  - 验证：输入后立即出现加载指示器，300ms 后搜索结果替换加载指示器，中间不闪现"无匹配"
