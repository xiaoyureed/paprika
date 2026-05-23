import { createRoot } from 'react-dom/client'
import { type ContentScriptContext } from 'wxt/utils/content-script-context'
import PromptSelector from './PromptSelector'

const PANEL_WIDTH = 360
const PANEL_MAX_HEIGHT = 280
const GAP = 4

/**
 * 在目标 input/textarea 附近创建浮动提示词选择面板
 *
 * - 通过 createShadowRootUi 隔离样式
 * - fixed 定位在输入框下方（空间不足时上方）
 * - 点击面板外 / Escape → 关闭
 * - 选中提示词 → 替换 /t 并插入内容 → 关闭
 *
 * @param ctx  - ContentScriptContext
 * @param input - 触发面板的输入框
 * @param matchIndex - /t 在 input.value 中的起始索引
 * @param onPanelClose - 面板关闭后的回调（用于重置状态）
 */
export async function createPromptSelectorUI(
  ctx: ContentScriptContext,
  input: HTMLInputElement | HTMLTextAreaElement,
  matchIndex: number,
  onPanelClose: () => void,
): Promise<void> {
  const rect = input.getBoundingClientRect()

  // 初步定位：输入框下方
  let left = rect.left
  let top = rect.bottom + GAP

  // 防溢出：水平方向
  if (left + PANEL_WIDTH > window.innerWidth) {
    left = window.innerWidth - PANEL_WIDTH - 8
  }
  if (left < 0) left = 8

  // 防溢出：垂直方向——下方空间不足时移到上方
  if (top + PANEL_MAX_HEIGHT > window.innerHeight) {
    top = rect.top - PANEL_MAX_HEIGHT - GAP
  }

  // 收集所有需要在 cleanup 时移除的句柄
  const cleanups: (() => void)[] = []

  const ui = await createShadowRootUi(ctx, {
    position: 'inline',
    name: 'prompt-selector',
    onMount(uiContainer, shadow, shadowHost) {
      // 面板容器
      const root = document.createElement('div')
      root.id = 'prompt-selector-root'
      root.style.cssText = `
        position: fixed;
        left: ${left}px;
        top: ${top}px;
        width: ${PANEL_WIDTH}px;
        max-height: ${PANEL_MAX_HEIGHT}px;
        z-index: 2147483647;
      `
      uiContainer.append(root)

      // ---- 内部回调 ----

      const handleSelect = (content: string) => {
        // 1) 先移除焦点陷阱与点击外部检测, 避免它们干扰后续操作
        cleanups.forEach((fn) => fn())
        cleanups.length = 0

        // 2) 修改输入框值
        const value = input.value
        const before = value.slice(0, matchIndex)
        const after = value.slice(matchIndex + 2)
        input.value = before + content + after
        input.selectionStart = before.length + content.length
        input.selectionEnd = before.length + content.length
        input.dispatchEvent(new Event('input', { bubbles: true }))

        // 3) 移除面板并聚焦页面输入框
        ui.remove()
        onPanelClose()
        input.focus()
      }

      const handleDismiss = () => {
        cleanup()
      }

      // ---- 焦点陷阱 ----
      // 防止用户在面板搜索框中输入时, 焦点泄漏到页面输入框
      const focusTrap = (e: FocusEvent) => {
        if (!shadowHost.contains(e.target as Node)) {
          const firstInput = shadow.querySelector('input, textarea')
          if (firstInput) {
            ;(firstInput as HTMLElement).focus()
          }
        }
      }
      document.addEventListener('focusin', focusTrap, true)
      cleanups.push(() => document.removeEventListener('focusin', focusTrap, true))

      // ---- 点击外部检测 ----
      const clickHandler = (e: MouseEvent) => {
        if (!shadowHost.contains(e.target as Node)) {
          cleanup()
        }
      }
      document.addEventListener('mousedown', clickHandler, true)
      cleanups.push(() => document.removeEventListener('mousedown', clickHandler, true))

      // ---- 渲染 React 组件 ----
      const reactRoot = createRoot(root)
      reactRoot.render(
        <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          <PromptSelector onSelect={handleSelect} onDismiss={handleDismiss} />
        </div>,
      )

      return { root, reactRoot }
    },
    onRemove(elements) {
      elements?.reactRoot.unmount()
      elements?.root.remove()
    },
  })

  ui.mount()

  // ---- 统一清理（未选中时关闭面板） ----
  function cleanup() {
    cleanups.forEach((fn) => fn())

    // 移除 /t 前缀
    const value = input.value
    const before = value.slice(0, matchIndex)
    const after = value.slice(matchIndex + 2)
    input.value = before + after
    input.selectionStart = before.length
    input.selectionEnd = before.length
    input.dispatchEvent(new Event('input', { bubbles: true }))

    ui.remove()
    onPanelClose()
    input.focus()
  }
}
