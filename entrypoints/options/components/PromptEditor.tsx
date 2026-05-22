import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import TagInput from './TagInput'

interface FormValues {
  name: string
  content: string
  tags: string[]
}

interface PromptEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 编辑时传入已有 prompt，新建时传 null */
  editingPrompt: Prompt | null
  onSave: (values: FormValues) => void
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  open,
  onOpenChange,
  editingPrompt,
  onSave,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    defaultValues: { name: '', content: '', tags: [] },
  })

  const tags = watch('tags')

  // 打开/切换编辑对象时重置表单
  useEffect(() => {
    if (open) {
      if (editingPrompt) {
        reset({
          name: editingPrompt.name,
          content: editingPrompt.content,
          tags: [...editingPrompt.tags],
        })
      } else {
        reset({ name: '', content: '', tags: [] })
      }
    }
  }, [open, editingPrompt, reset])

  const onSubmit = (data: FormValues) => {
    if (!data.name.trim() || !data.content.trim()) {
      toast.error('名称和内容不能为空')
      return
    }
    onSave(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingPrompt ? '编辑提示词' : '新建提示词'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 名称 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">名称</label>
            <Input
              placeholder="提示词名称"
              className="h-10"
              {...register('name')}
            />
          </div>

          {/* 内容 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">内容</label>
            <Textarea
              placeholder="输入提示词模板内容..."
              rows={12}
              className="resize-y min-h-[180px] text-sm leading-relaxed"
              {...register('content')}
            />
          </div>

          {/* 标签 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">标签</label>
            <TagInput
              tags={tags}
              onChange={(newTags) => setValue('tags', newTags)}
              placeholder="输入标签后按回车添加"
            />
          </div>

          <DialogFooter showCloseButton>
            <Button type="submit" size="lg">
              {editingPrompt ? '保存修改' : '创建提示词'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PromptEditor
