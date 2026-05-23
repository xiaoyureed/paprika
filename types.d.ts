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
    | 'palette-typing'
  payload?: T
}

/** palette-typing 消息的 payload 结构 */
interface PaletteTypingPayload {
  query: string
  seq: number // 请求序号，用于客户端丢弃过期响应
}

/** palette-typing 的响应结构 */
interface PaletteTypingResponse {
  results: IBookmark[]
  totalCount: number
  seq: number // 回传请求序号，客户端校验
}

interface Prompt {
  id: string
  name: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}
