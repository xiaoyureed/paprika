interface IMessage<T = any> {
  action: 'post' | 'comment' | 'open-side-bar' | 'palette' | 'get-tabs' | 'switch-tab' |'get-bookmarks'| 'open-bookmark' | 'openOptionsPage'
  payload?: T
}

interface Prompt {
  id: string
  name: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}
