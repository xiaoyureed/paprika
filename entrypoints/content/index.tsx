import { createRoot } from 'react-dom/client'
import '@/assets/tailwind.css'
import React, { StrictMode } from 'react'
import { type ContentScriptContext } from 'wxt/utils/content-script-context'
import { Toaster } from '@/components/ui/sonner'
import Post from './Post'
import Comment from './Comment'
import Palette from './Palette'
import ModalWrapper from './ModalWrapper'
import { setupTriggerDetector } from './useTriggerDetector'
import { createPromptSelectorUI } from './createPromptSelectorUI'

export default defineContentScript({
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  main,
})

interface IShareStatus {
  modalOpen: boolean
}

async function main(ctx: ContentScriptContext) {
  const shareStatus: IShareStatus = {
    modalOpen: false,
  }

  // 监听后台消息，按 action 分发组件
  browser.runtime.onMessage.addListener(
    async (message: IMessage, _sender, _sendResponse) => {
      const comp = selectByMessage(message.action)

      if (!comp || shareStatus.modalOpen) {
        return
      }
      const ui = await createModal(ctx, comp, shareStatus)
      ui?.mount()
      shareStatus.modalOpen = true
    },
  )

  // 初始化 /t 触发检测
  setupTriggerDetector(
    ctx,
    (input, matchIndex) => {
      shareStatus.modalOpen = true
      createPromptSelectorUI(ctx, input, matchIndex, () => {
        shareStatus.modalOpen = false
      })
    },
    () => shareStatus.modalOpen,
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

/**
 * 创建模态框
 */
const createModal = async (
  ctx: ContentScriptContext,
  Comp: React.FC<{
    onRemove: () => void
  }>,
  shareStatus: IShareStatus,
) => {
  const ui = await createShadowRootUi(ctx, {
    position: 'inline',
    name: 'rain-element',
    onMount: function (
      uiContainer: HTMLElement,
      shadow: ShadowRoot,
      shadowHost: HTMLElement,
    ) {
      const root = document.createElement('div')
      root.id = 'rain-root'
      root.className =
        'fixed inset-0 z-99999 bg-gray-300/50 backdrop-blur-md flex justify-center'
      uiContainer.append(root)

      // trick: 使 sonner toast 在 Shadow DOM 中正常显示
      document.head.querySelectorAll('style').forEach((styleEl) => {
        if (styleEl.textContent?.includes('[data-sonner-toaster]')) {
          shadow.append(styleEl)
        }
      })

      const onRemove = () => {
        shareStatus.modalOpen = false
        ui.remove()
      }

      const reactRoot = createRoot(root)
      reactRoot.render(
        <ModalWrapper
          shadow={shadow}
          shadowHost={shadowHost}
          root={root}
          onRemove={onRemove}
        >
          <Comp onRemove={onRemove} />
        </ModalWrapper>,
      )
      return { root, reactRoot }
    },
    onRemove: function (elements): void {
      elements?.reactRoot.unmount()
      elements?.root.remove()
    },
  })
  return ui
}
