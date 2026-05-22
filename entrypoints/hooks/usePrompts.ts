import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '@/utils/constants'

/**
 * 管理提示词列表的 hook，封装 chrome.storage.local 读写
 */
export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    browser.storage.local.get(STORAGE_KEYS.prompts).then((obj) => {
      const stored = obj[STORAGE_KEYS.prompts] as Prompt[] | undefined
      if (Array.isArray(stored)) {
        setPrompts(stored)
      }
      setLoaded(true)
    })
  }, [])

  // 持久化到 storage
  const persist = useCallback((list: Prompt[]) => {
    browser.storage.local.set({ [STORAGE_KEYS.prompts]: list })
    setPrompts(list)
  }, [])

  const addPrompt = useCallback(
    (name: string, content: string, tags: string[]) => {
      const now = Date.now()
      const newPrompt: Prompt = {
        id: crypto.randomUUID(),
        name,
        content,
        tags,
        createdAt: now,
        updatedAt: now,
      }
      persist([...prompts, newPrompt])
      return newPrompt
    },
    [prompts, persist],
  )

  const updatePrompt = useCallback(
    (id: string, name: string, content: string, tags: string[]) => {
      const list = prompts.map((p) =>
        p.id === id
          ? { ...p, name, content, tags, updatedAt: Date.now() }
          : p,
      )
      persist(list)
    },
    [prompts, persist],
  )

  const deletePrompt = useCallback(
    (id: string) => {
      persist(prompts.filter((p) => p.id !== id))
    },
    [prompts, persist],
  )

  return { prompts, loaded, addPrompt, updatePrompt, deletePrompt }
}
