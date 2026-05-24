import '@/assets/tailwind.css'
import { type ContentScriptContext } from 'wxt/utils/content-script-context'
import Post from './ai-ask/Post'
import Comment from './ai-ask/Comment'
import Palette from './Palette'
import { setupTriggerDetector } from './prompt/useTriggerDetector'
import { createPromptSelectorUI } from './prompt/createPromptSelectorUI'
import { createUI } from './createUI'

export default defineContentScript({
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  main,
})

export interface ISharedStatus {
  modalOpen: boolean
}

async function main(ctx: ContentScriptContext) {
  const shared: ISharedStatus = {
    modalOpen: false,
  }

  let paletteUI: Awaited<ReturnType<typeof createUI>> | null = null

  // 监听后台消息，按 action 分发组件
  browser.runtime.onMessage.addListener(
    async (message: IMessage, _sender, _sendResponse) => {
      if (message.action === 'palette' && shared.modalOpen) {
        paletteUI?.remove()
        paletteUI = null
        shared.modalOpen = false
        return
      }
      
      const comp = selectByMessage(message.action)
      console.log('got msg:', message)
      console.log('sharedStatus:', shared)

      if (!comp || shared.modalOpen) {
        return
      }

      const ui = await createUI(
        ctx,
        message.action,
        comp,
        'fixed top-0 left-0 right-0 z-99999 w-1/2 min-w-100 mx-auto h-auto mt-28 border border-border rounded-xl shadow-2xl',
        () => {
          shared.modalOpen = false
        },
      )
      ui.mount()
      paletteUI = ui
      shared.modalOpen = true
    },
  )

  // 初始化 /t 触发检测
  setupTriggerDetector(
    ctx,
    (input, matchIndex) => {
      shared.modalOpen = true
      createPromptSelectorUI(ctx, input, matchIndex, () => {
        shared.modalOpen = false
      })
    },
    () => shared.modalOpen,
  )
}

function selectByMessage(action: IMessage['action']) {
  switch (action) {
    case 'post':
      return Post
    case 'comment':
      return Comment
    case 'palette':
      return Palette
    default:
      console.error('[content script] unknown action: ', action)
      return undefined
  }
}
