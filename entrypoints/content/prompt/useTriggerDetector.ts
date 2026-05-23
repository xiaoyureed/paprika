import { type ContentScriptContext } from 'wxt/utils/content-script-context'

/**
 * 文本类 input 的 type 白名单
 */
const TEXT_INPUT_TYPES = new Set(['text', 'search', 'url', 'email'])

function isTextInput(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (!el || !(el instanceof HTMLElement)) return false
  if (el instanceof HTMLTextAreaElement) return true
  if (el instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(el.type)) return true
  return false
}

type TriggerCallback = (input: HTMLInputElement | HTMLTextAreaElement, matchIndex: number) => void

/**
 * 设置全局 input 事件委托，检测用户在文本输入框中输入 /t（词边界）时触发回调
 *
 * @param ctx  - ContentScriptContext，用于绑定生命周期
 * @param onTrigger - 触发时的回调，传入目标 input 元素和 /t 在 value 中的索引
 * @param isPanelVisible - 返回当前面板是否可见，避免重复创建
 * @returns cleanup 函数
 */
export function setupTriggerDetector(
  ctx: ContentScriptContext,
  onTrigger: TriggerCallback,
  isPanelVisible: () => boolean,
): () => void {
  // /t 在词边界出现时触发：行首或前面是空白，后面是空白或行尾
  const TRIGGER_REGEX = /(?:^|\s)(\/t)(?=\s|$)/

  const handleInput = (e: Event) => {
    if (isPanelVisible()) return

    const target = e.target
    if (!isTextInput(target)) return
    if (target.readOnly || target.disabled) return

    const value = target.value
    const match = TRIGGER_REGEX.exec(value)
    if (!match) return

    // 计算 /t 在 value 中的位置（忽略前面的空白前缀）
    const matchIndex = match.index + (match[0].length - match[1].length)
    onTrigger(target, matchIndex)
  }

  // 使用捕获阶段以覆盖可能的 stopPropagation
  document.addEventListener('input', handleInput, true)

  const cleanup = () => {
    document.removeEventListener('input', handleInput, true)
  }

  ctx.onInvalidated(cleanup)

  return cleanup
}
