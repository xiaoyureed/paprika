import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { BookmarkIcon } from "lucide-react"

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
  // 点击去除
  onRemove: () => void
}> = ({ onRemove }) => {
  const [tabs, setTabs] = useState<ITab[]>([])
  const [bookmarks, setBookmarks] = useState<IBookmark[]>([])

  useEffect(() => {
    // 组件挂载后， 获取所有标签页
    // 如果有多个异步操作， 可以使用 Promise.all 来等待所有操作完成
    browser.runtime.sendMessage({ action: 'get-tabs' } as IMessage, (tabs) => {
      setTabs(tabs)
    })
    browser.runtime.sendMessage(
      { action: 'get-bookmarks' } as IMessage,
      (bookmarks) => {
        setBookmarks(bookmarks)
      },
    )
  }, [])

  console.debug(tabs, typeof tabs + ' <-- tabs')

  const onTabSelect = (tab: ITab) => {
    browser.runtime.sendMessage({
      action: 'switch-tab',
      payload: tab.id,
    } as IMessage)
  }

  const onBookmarkSelect = (bookmark: IBookmark) => {
    browser.runtime.sendMessage({
      action: 'open-bookmark',
      payload: bookmark.url,
    } as IMessage)
  }

  return (
    <div>
      <Command className="bg-background px-2 h-auto">
        <CommandInput placeholder="Type a command or search..." autoFocus />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Suggestions">
            <CommandItem onSelect={onRemove}>Exit</CommandItem>
          </CommandGroup>
          <CommandSeparator />

          <CommandGroup heading="标签页">
            {tabs &&
              tabs.map((tab, i) => (
                <CommandItem
                  key={i}
                  value={'tab' + i}
                  keywords={[tab.title]}
                  onSelect={() => {
                    onTabSelect(tab)
                  }}
                >
                  <img
                    src={tab.favIconUrl}
                    alt=""
                    className="w-4 h-4 shrink-0"
                  />
                  {tab.title}
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="书签">
            {bookmarks &&
              bookmarks.map((bookmark, i) => (
                <CommandItem
                  key={i}
                  value={'bm' + i}
                  keywords={[bookmark.title, bookmark.url]}
                  onSelect={() => {
                    onBookmarkSelect(bookmark)
                  }}
                >
                  <BookmarkIcon />
                  {bookmark.title}
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
}

export default Palette
