import { StrictMode } from 'react'
import { Toaster } from 'sonner'

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

export default ModalWrapper
