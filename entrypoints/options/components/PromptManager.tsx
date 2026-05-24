import { useState, useMemo, useRef } from 'react'
import { Search, Plus, Pencil, Trash2, FileText, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { usePrompts } from '@/entrypoints/hooks/usePrompts'
import PromptEditor from './PromptEditor'

const PromptManager: React.FC = () => {
  const { prompts, loaded, addPrompt, updatePrompt, deletePrompt } = usePrompts()
  const [search, setSearch] = useState('')
  // 隐藏的文件选择器，点击导入按钮触发
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)

  // 按名称/内容/标签搜索
  const filtered = useMemo(() => {
    if (!search.trim()) return prompts
    const q = search.toLowerCase()
    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    )
  }, [prompts, search])

  // 按更新时间降序排列
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.updatedAt - a.updatedAt),
    [filtered],
  )

  const handleCreate = () => {
    setEditingPrompt(null)
    setEditorOpen(true)
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setEditorOpen(true)
  }

  const handleDelete = (prompt: Prompt) => {
    deletePrompt(prompt.id)
    toast.success(`已删除「${prompt.name}」`)
  }

  const handleSave = (values: { name: string; content: string; tags: string[] }) => {
    if (editingPrompt) {
      updatePrompt(editingPrompt.id, values.name, values.content, values.tags)
      toast.success('提示词已更新')
    } else {
      addPrompt(values.name, values.content, values.tags)
      toast.success('提示词已创建')
    }
  }

  /** 导出全部提示词为 JSON 文件 */
  const handleExport = () => {
    if (prompts.length === 0) {
      toast.error('没有可导出的提示词')
      return
    }

    const data = {
      version: 1,
      prompts,
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })

    const date = new Date().toISOString().slice(0, 10)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paprika-prompts-${date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`已导出 ${prompts.length} 个提示词`)
  }

  /** 校验并导入文件中的提示词，追加到列表 */
  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 重置 input value，允许重复选择同一文件
    e.target.value = ''

    try {
      const text = await file.text()
      let data: any
      try {
        data = JSON.parse(text)
      } catch {
        toast.error('文件格式不正确，请选择有效的 JSON 文件')
        return
      }

      if (typeof data.version !== 'number') {
        toast.error('无法识别文件格式')
        return
      }

      if (!Array.isArray(data.prompts)) {
        toast.error('文件中没有可导入的提示词')
        return
      }

      // 逐条校验并导入
      for (let i = 0; i < data.prompts.length; i++) {
        const p = data.prompts[i]
        if (!p.name || !p.content) {
          toast.error(`第 ${i + 1} 个提示词缺少名称或内容`)
          return
        }
        addPrompt(p.name, p.content, Array.isArray(p.tags) ? p.tags : [])
      }

      toast.success(`成功导入 ${data.prompts.length} 个提示词`)
    } catch {
      toast.error('读取文件失败')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-8 py-8">
      {/* 顶栏 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">提示词管理</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            管理自定义 AI 提示词模板，支持标签分类和全文搜索
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" onClick={handleImport}>
            <Upload />
            导入
          </Button>
          <Button variant="outline" size="lg" onClick={handleExport}>
            <Download />
            导出
          </Button>
          <Button onClick={handleCreate} size="lg">
            <Plus />
            新建提示词
          </Button>
        </div>
      </div>
      {/* 隐藏的文件选择器，仅用于导入 */}
      <input ref={fileInputRef} type="file" accept=".json" className="hidden"
        onChange={handleFileChange} />

      {/* 搜索栏 */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索名称、内容或标签..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* 列表 */}
      <ScrollArea className="flex-1">
        {!loaded ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            加载中...
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <FileText className="size-12" />
            <p className="text-sm">
              {search.trim() ? '没有匹配的提示词' : '还没有提示词，点击上方按钮创建'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((prompt) => (
              <div
                key={prompt.id}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* 名称 */}
                    <h3 className="truncate text-base font-medium text-foreground">
                      {prompt.name}
                    </h3>

                    {/* 内容预览 */}
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
                      {prompt.content}
                    </p>

                    {/* 标签 */}
                    {prompt.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {prompt.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(prompt)}
                      aria-label="编辑"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(prompt)}
                      aria-label="删除"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator className="my-6" />

      {/* 底部统计 */}
      <div className="text-sm text-muted-foreground">
        共 {prompts.length} 个提示词
        {search.trim() && `（搜索到 ${sorted.length} 个）`}
      </div>

      {/* 编辑器弹窗 */}
      <PromptEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingPrompt={editingPrompt}
        onSave={handleSave}
      />
    </div>
  )
}

export default PromptManager
