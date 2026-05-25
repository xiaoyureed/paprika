import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { BookmarkIcon, Loader2Icon } from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  BOOKMARK_VIRTUAL_THRESHOLD,
  BOOKMARK_SEARCH_DEBOUNCE,
  BOOKMARK_VIRTUAL_OVERSCAN,
} from '@/utils/constants'
import useDebouncedCallback from '@/entrypoints/hooks/useDebounce'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

export interface ITab {
  id: number
  title: string
  url: string
  favIconUrl: string
}

export interface IBookmark {
  id: number
  title: string
  url: string
  path: string
}

const Palette: React.FC<{
  children?: React.ReactNode
  onRemove?: () => void
}> = ({ onRemove }) => {
  const [tabs, setTabs] = useState<ITab[]>([])
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [searching, setSearching] = useState(false)
  const seqRef = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 按需搜索书签，通过 seq 丢弃过期响应
  const searchBookmarks = useCallback((query: string) => {
    const currentSeq = ++seqRef.current
    setSearching(true)
    browser.runtime.sendMessage(
      { action: 'palette-typing', payload: { query, seq: currentSeq } },
      (response: PaletteTypingResponse) => {
        // 丢弃序号不匹配的过期响应
        if (!response || response.seq !== currentSeq) return
        setBookmarks(response.results)
        setTotalCount(response.totalCount)
        setSearching(false)
      },
    )
  }, [])

  const debouncedSearch = useDebouncedCallback(
    searchBookmarks,
    BOOKMARK_SEARCH_DEBOUNCE,
  )

  // 初次加载：发起空查询获取最近 10 条
  useEffect(() => {
    searchBookmarks('')
  }, [searchBookmarks])

  // 获取所有标签页
  useEffect(() => {
    browser.runtime.sendMessage({ action: 'get-tabs' } as IMessage, (tabs) => {
      setTabs(tabs)
    })
  }, [])

  // 结果数超过阈值时启用虚拟滚动
  const useVirtual = bookmarks.length > BOOKMARK_VIRTUAL_THRESHOLD
  const virtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 36,
    overscan: BOOKMARK_VIRTUAL_OVERSCAN,
    enabled: useVirtual,
  })

  const onTabSelected = (tab: ITab) => {
    browser.runtime.sendMessage({
      action: 'switch-tab',
      payload: tab.id,
    } as IMessage)
  }

  const onBookmarkSelected = (bookmark: IBookmark) => {
    browser.runtime.sendMessage({
      action: 'open-bookmark',
      payload: bookmark.url,
    } as IMessage)
  }
  const onNotepadSelected = () => {
    browser.runtime.sendMessage({
      action: 'notepad',
      // payload: 'data:text/html,<html contenteditable>',
      payload:
        'data:text/html,<html contenteditable style="margin:2rem;font-size:18px;line-height:1.5;">Hi',
    } as IMessage)
  }

  function onPromptManagementSelected(): void {
    browser.runtime.sendMessage({ action: 'openOptionsPage' } as IMessage)
  }

  return (
    <Card>
      <CardContent>
        <Command className="bg-background px-2 h-auto">
          <CommandInput
            placeholder="搜索 Tab 或者书签"
            autoFocus
            onValueChange={debouncedSearch}
          />
          <CommandList ref={scrollRef} className="max-h-[70vh]">
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={onRemove}>退出</CommandItem>
              <CommandItem onSelect={onNotepadSelected}>记事本</CommandItem>
              <CommandItem onSelect={onPromptManagementSelected}>
                提示词
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />

            <CommandGroup heading="标签页">
              {tabs.map((tab, i) => (
                <CommandItem
                  key={i}
                  value={'tab' + i}
                  keywords={[tab.title, tab.url]}
                  onSelect={() => onTabSelected(tab)}
                >
                  <img
                    src={tab.favIconUrl || undefined}
                    alt=""
                    className="w-4 h-4 shrink-0"
                  />
                  {tab.title}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup
              heading={`书签${searching ? '' : totalCount > 0 ? ` (${totalCount})` : ''}`}
            >
              {/* 搜索中且无缓存结果 */}
              {searching && bookmarks.length === 0 && (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <Loader2Icon className="size-4 animate-spin mr-2" />
                  搜索中...
                </div>
              )}
              {/* 搜索完成且无结果 */}
              {!searching && bookmarks.length === 0 && (
                <div className="py-2 px-2 text-sm text-muted-foreground">
                  暂无书签
                </div>
              )}
              {/* 有结果：按阈值选择渲染模式 */}
              {bookmarks.length > 0 &&
                (useVirtual ? (
                  <div
                    style={{
                      height: `${virtualizer.getTotalSize()}px`,
                      width: '100%',
                      position: 'relative',
                    }}
                  >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                      const bookmark = bookmarks[virtualItem.index]
                      return (
                        <CommandItem
                          key={bookmark.id}
                          value={'bm' + virtualItem.index}
                          keywords={[bookmark.title, bookmark.url]}
                          onSelect={() => onBookmarkSelected(bookmark)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                        >
                          <BookmarkIcon />
                          <span className="truncate min-w-0">
                            {bookmark.title}
                          </span>
                        </CommandItem>
                      )
                    })}
                  </div>
                ) : (
                  bookmarks.map((bookmark, i) => (
                    <CommandItem
                      key={bookmark.id}
                      value={'bm' + i}
                      keywords={[bookmark.title, bookmark.url]}
                      onSelect={() => onBookmarkSelected(bookmark)}
                    >
                      <BookmarkIcon />
                      <span className="truncate min-w-0">{bookmark.title}</span>
                    </CommandItem>
                  ))
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CardContent>
      <CardFooter className="flex items-center justify-around text-gray-400 text-[14px] h-8">
        <div>⌘/Ctrl + i 搜索</div>
        <div>↑↓ 导航</div>
        <div>Enter 选中</div>
      </CardFooter>
    </Card>
  )
}

export default Palette
