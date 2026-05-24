import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { type ContentScriptContext } from 'wxt/utils/content-script-context'

export async function createUI(
  ctx: ContentScriptContext,
  rootId: string,
  Comp: React.FC<{
    onRemove?: () => void
  }>,
  rootClassName: string,
  clearFn?: () => void,
) {
  const ui = await createShadowRootUi(ctx, {
    position: 'inline',
    name: 'paprika-element',
    onMount: function (
      uiContainer: HTMLElement, // 默认 document.body
      shadow: ShadowRoot,
      shadowHost: HTMLElement, // 代表 生成的shadow dom 根节点 eg. rain-element
    ) {
      const root = document.createElement('div')
      root.id = rootId
      root.className = rootClassName
      uiContainer.append(root)

      // ---- 暗黑模式：跟随 OS prefers-color-scheme ----
      // Shadow DOM 与宿主页面隔离，宿主 <html> 的 .dark 不会透传，
      // 需要手动检测并在 Shadow DOM 根容器上切换 .dark class
      const darkMedia = window.matchMedia('(prefers-color-scheme: dark)')
      const updateDarkClass = () => {
        root.classList.toggle('dark', darkMedia.matches)
      }
      updateDarkClass()
      darkMedia.addEventListener('change', updateDarkClass)

      // trick: 使 sonner toast 在 Shadow DOM 中正常显示
      document.head.querySelectorAll('style').forEach((styleEl) => {
        if (styleEl.textContent?.includes('[data-sonner-toaster]')) {
          shadow.append(styleEl)
        }
      })

      // 阻止滚动
      document.body.style.overflow = 'hidden'

      // 如果焦点不在 shadow dom, 抢回来
      const focusTrap = (e: FocusEvent) => {
        if (e.target !== shadowHost) {
          const firstInput = shadow.querySelector('input')
          if (firstInput) {
            firstInput.focus()
          }
        }
      }
      document.addEventListener('focusin', focusTrap, true)

      const onClickRoot = (e: PointerEvent): void => {
        if (!shadowHost.contains(e.target as Node)) {
          ui.remove()
        }
      }
      document.addEventListener('click', onClickRoot)

      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          ui.remove()
        }
      }
      document.addEventListener('keydown', handleKeydown, true)

      const removeCallback = () => {
        document.body.style.overflow = 'auto'
        darkMedia.removeEventListener('change', updateDarkClass)
        document.removeEventListener('focusin', focusTrap, true)
        document.removeEventListener('click', onClickRoot)
        document.removeEventListener('keydown', handleKeydown, true)
        clearFn?.()
      }

      const reactRoot = createRoot(root)
      reactRoot.render(
        <StrictMode>
          <Toaster />
          <Comp onRemove={() => ui.remove()} />
        </StrictMode>,
      )
      return { root, reactRoot, removeCallback }
    },
    onRemove: function (elements): void {
      elements?.reactRoot.unmount()
      elements?.root.remove()
      elements?.removeCallback()
    },
  })
  return ui
}
