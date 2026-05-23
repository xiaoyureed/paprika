import { createRoot } from 'react-dom/client'
import { type ContentScriptContext } from 'wxt/utils/content-script-context'
import { StrictMode } from 'react'
import { Toaster } from 'sonner'

export interface ISharedStatus {
  modalOpen: boolean
}

/**
 * 创建模态框 UI
 * @param ctx 内容脚本上下文
 * @param Comp 组件
 * @param shareStatus 分享状态
 * @returns UI 元素
 */
export const createModalUI = async (
  ctx: ContentScriptContext,
  Comp: React.FC<{
    onRemove: () => void
  }>,
  shareStatus: ISharedStatus,
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

const ModalWrapper: React.FC<{
  children?: React.ReactNode
  shadow: ShadowRoot
  // 代表 生成的根节点 eg. rain-element
  shadowHost: HTMLElement
  root: HTMLElement
  onRemove: () => void
}> = ({ children, shadow, shadowHost, root, onRemove }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const focusTrap = (e: FocusEvent) => {
      // 如果焦点不在 shadow dom, 抢回来
      if (e.target !== shadowHost) {
        const firstInput = shadow.querySelector('input')
        if (firstInput) {
          ;(firstInput as HTMLElement).focus()
        }
      }
    }
    document.addEventListener('focusin', focusTrap, true)

    const onClickRoot = (e: PointerEvent): void => {
      // event.target 是你实际用鼠标点到的最内层那个元素
      // event.currentTarget 是绑定了当前事件监听器的元素（即 parent 本身）
      if (e.target === e.currentTarget) {
        onRemove()
      }
    }
    root.addEventListener('click', onClickRoot)

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onRemove()
      }
    }
    document.addEventListener('keydown', handleKeydown, true)

    return () => {
      document.body.style.overflow = 'auto'
      document.removeEventListener('focusin', focusTrap, true)
      root.removeEventListener('click', onClickRoot)
      document.removeEventListener('keydown', handleKeydown, true)
    }
  }, [])

  return (
    <StrictMode>
      <Toaster />
      <div className="w-1/2 min-w-100 mx-auto h-auto max-h-[70vh] mt-28">
        {children}
      </div>
    </StrictMode>
  )
}
