import { Button } from '@/components/ui/button'

const Comment: React.FC<{
  children?: React.ReactNode
  onRemove: () => void
}> = ({ onRemove }) => {
  return (
    <div>
      <Button>Open</Button>
    </div>
  )
}

export default Comment
