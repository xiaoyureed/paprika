import '@/assets/tailwind.css'
import { type ContentScriptContext } from 'wxt/utils/content-script-context'
import Post from './ai-ask/Post'
import Comment from './ai-ask/Comment'
import Palette from './Palette'
import { setupTriggerDetector } from './prompt/useTriggerDetector'
import { createPromptSelectorUI } from './prompt/createPromptSelectorUI'
import { createModalUI, type ISharedStatus } from "./createModalUI"

export default defineContentScript({
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  main,
})


async function main(ctx: ContentScriptContext) {
  const sharedStatus: ISharedStatus = {
    modalOpen: false,
  }

  // 监听后台消息，按 action 分发组件
  browser.runtime.onMessage.addListener(
    async (message: IMessage, _sender, _sendResponse) => {
      const comp = selectByMessage(message.action)

      if (!comp || sharedStatus.modalOpen) {
        return
      }
      const ui = await createModalUI(ctx, comp, sharedStatus)
      ui?.mount()
      sharedStatus.modalOpen = true
    },
  )

  // 初始化 /t 触发检测
  setupTriggerDetector(
    ctx,
    (input, matchIndex) => {
      sharedStatus.modalOpen = true
      createPromptSelectorUI(ctx, input, matchIndex, () => {
        sharedStatus.modalOpen = false
      })
    },
    () => sharedStatus.modalOpen,
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
