import { cn } from '@/lib/utils'
import { CircleX } from 'lucide-react'

const ModalHeader: React.FC<{
  children?: React.ReactNode
  title: string
  onRemove?: (ui: ShadowRootContentScriptUi<HTMLDivElement>) => void
  className?: string
}> = ({ title, onRemove, className }) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <button onClick={() => onRemove?.(ui)} className="hover:bg-secondary">
        <CircleX />
        <span className="sr-only">Close modal</span>
      </button>
    </div>
  )
}

export default ModalHeader
