import { useEffect, useState } from 'react'

export function useStorage<T>(key: string, defaultValue?: T) {
  const [value, setValue] = useState<T | undefined>(defaultValue)

  // 读取
  useEffect(() => {
    browser.storage.local.get(key).then((obj) => {
      if (obj[key] !== undefined) {
        setValue(obj[key] as T)
      }
    })
  }, [key])

  // 保存
  const setStorageValue = (newValue: T) => {
    browser.storage.local.set({ [key]: newValue })
  }

  return [value, setStorageValue] as const
}
