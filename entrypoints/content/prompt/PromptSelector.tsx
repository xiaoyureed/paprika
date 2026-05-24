import { useEffect, useState } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { STORAGE_KEYS } from '@/utils/constants'
import { useStorage } from '@/entrypoints/hooks/useStorage'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface PromptSelectorProps {
  onSelect: (content: string) => void
  onDismiss: () => void
}

/**
 * 提示词选择面板——浮动搜索式选择器
 *
 * 展示从 chrome.storage.local 读取的提示词列表，
 * 用户可搜索名称/内容/标签，选中后回调 onSelect。
 */
const PromptSelector: React.FC<PromptSelectorProps> = ({
  onSelect,
  onDismiss,
}) => {
  const [prompts, setPrompts] = useStorage<Prompt[]>(STORAGE_KEYS.prompts, [])

  return (
    <Command
      shouldFilter
      // Escape 键由 Command 内部处理，但我们额外监听以关闭面板
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          // 阻止 cmdk 默认行为（会清除输入），直接关闭面板
          e.preventDefault()
          onDismiss()
        }
      }}
    >
      <div className="relative">
        <CommandInput
          placeholder="搜索提示词..."
          autoFocus
          className="pr-12"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            browser.runtime.sendMessage({ action: 'openOptionsPage' })
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          添加
        </Button>
      </div>

      <CommandList>
        <CommandEmpty>无匹配提示词</CommandEmpty>
        <CommandGroup>
          {prompts?.map((p) => {
            // 将名称、内容、标签合并为 value，cmdk 据此进行模糊匹配
            const searchValue = `${p.name} ${p.content} ${p.tags.join(' ')}`
            return (
              <CommandItem
                key={p.id}
                value={searchValue}
                onSelect={() => {
                  onSelect(p.content)
                }}
              >
                <span className="truncate font-medium">{p.name}</span>
                {p.tags.length > 0 && (
                  <span className="ml-auto flex shrink-0 gap-1">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

export default PromptSelector
