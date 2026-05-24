import { SHORTCUTS } from '@/utils/constants'
import { IBookmark } from '../content/Palette'

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    console.log('Hello background!', { id: browser.runtime.id })
  })

  createContextMenus()

  listenShortcuts()

  listenMessage()
})

// 监听 content script 发送的消息
function listenMessage() {
  browser.runtime.onMessage.addListener(
    (message: IMessage, sender, sendResponse) => {
      // 获取当前活动窗口的所有标签页
      if (message.action === 'get-tabs') {
        browser.tabs.query({ currentWindow: true }, (tabs) => {
          const formatTabs = tabs.map((t) => {
            return {
              id: t.id,
              title: t.title,
              url: t.url,
              favIconUrl: t.favIconUrl,
            }
          })
          sendResponse(formatTabs)
        })

        // sendResponse 在异步操作中调用， 必须返回 true 才能保持消息通道打开， 否则消息发送不到content script
        return true
      }

      // 切换到目标标签页
      else if (message.action === 'switch-tab') {
        browser.tabs.update(message.payload, { active: true })
      }

      // Get all bookmarks
      else if (message.action === 'get-bookmarks') {
        
        browser.bookmarks.getTree((tree) => {
          const result: IBookmark[] = []
          tree.forEach((n: any) => traverse(n, '', result))
          sendResponse(result)
        })
        return true
      }

      // 打开书签页
      else if (message.action === 'open-bookmark') {
        browser.tabs.create({
          url: message.payload,
          active: true,
        })
      }

      // 在 Popup 中点击"提示词管理"，通过 Background 在新标签页打开 Options 页
      else if (message.action === 'openOptionsPage') {
        try {
          const optionsUrl = browser.runtime.getURL('/options.html');
          browser.tabs.create({ url: optionsUrl });
          sendResponse({ success: true });
        } catch (error) {
          console.error('Failed to open options page via tabs.create, fallback to openOptionsPage', error);
          browser.runtime.openOptionsPage();
          sendResponse({ success: true, fallback: true });
        }
      }

      // 书签按需搜索：空查询返回最近 10 条，非空查询调用 bookmarks.search()
      else if (message.action === 'palette-typing') {
        const { query, seq } = message.payload as PaletteTypingPayload

        if (!query || query.trim() === '') {
          browser.bookmarks.getRecent(10).then((recent) => {
            const results: IBookmark[] = recent
              .filter((item) => item.url)
              .map((item) => ({
                id: parseInt(item.id, 10),
                title: item.title || 'Untitled',
                url: item.url!,
                path: '',
              }))
            sendResponse({ results, totalCount: results.length, seq })
          })
        } else {
          browser.bookmarks.search(query).then((items) => {
            const results: IBookmark[] = items
              .filter((item) => item.url)
              .map((item) => ({
                id: parseInt(item.id, 10),
                title: item.title || 'Untitled',
                url: item.url!,
                path: '',
              }))
            sendResponse({ results, totalCount: results.length, seq })
          })
        }

        return true
      }

      // 记事本功能
      else if (message.action === 'notepad') {
        browser.tabs.create({
          active: true,
          url: message.payload,
        })
      }

      else {
        console.error('unknown action:', message.action)
      }
    },
  )
}

function traverse(node: any, path: string, result: IBookmark[]) {
  if (node.url) {
    result.push({
      id: node.id,
      title: node.title || 'Untitled',
      url: node.url,
      path: path,
    })
  } else if (node.children) {
    const folderPath = path ? `${path}/${node.title}` : node.title
    node.children.forEach((child: any) => traverse(child, folderPath, result))
  }
}

function listenShortcuts() {
  browser.commands.onCommand.addListener(async (cmd, _tab) => {
    // 监听快捷键事件，发送"打开命令面板"的消息给 content script

    if (cmd === SHORTCUTS.openPalette) {
      // 获取当前活动标签页
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })

      browser.tabs.sendMessage(
        tab.id!,
        { action: 'palette' } as IMessage,
      )
    }
  })
}

function createContextMenus() {
  const openSideBar = 'open-side-bar'
  const post = 'post'
  const comment = 'comment'

  // 创建上下文菜单 (地址栏必须有网页地址才能点击)
  browser.contextMenus.create({
    id: openSideBar, // 唯一标识符, 必须
    title: 'Open Side Bar',
    contexts: ['all'],
  })
  browser.contextMenus.create({
    id: post,
    title: 'Post总结',
    contexts: ['all'],
  })
  browser.contextMenus.create({
    id: comment,
    title: 'Comment总结',
    contexts: ['all'],
  })

  // 监听上下文菜单点击事件
  browser.contextMenus.onClicked.addListener(async (clickData, tab) => {
    if (!tab?.id) {
      console.error('tab id is undefined')
      return
    }

    if (clickData.menuItemId === openSideBar) {
      // await browser.tabs.sendMessage(tab.id, { type: 'open-side-bar' })
    }
    if (clickData.menuItemId === post) {
      browser.tabs.sendMessage(
        tab.id,
        { action: 'post' } as IMessage,
        // 没有消息要接受， 就注释掉， 否则报错   , browser.runtime.lastError 会报错
        // (res) => {
        //   console.log('background: got resp:', res)
        // },
      )
    }
  
    if (clickData.menuItemId === comment) {
      browser.tabs.sendMessage(tab.id, { action: 'comment' } as IMessage)
    }
  })
}
