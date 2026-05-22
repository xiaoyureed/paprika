import { useState, useEffect } from 'react'
import { STORAGE_KEYS } from '@/utils/constants'

export interface IFormData {
  apiUrl: string
  apiKey: string
}

export const useFormData = () => {
  const [formData, setFormData] = useState<IFormData>({
    apiUrl: '',
    apiKey: '',
  })
  // 初始化时从本地存储获取 formData
  useEffect(() => {
    browser.storage.local.get(
      [STORAGE_KEYS.formData],
      (result: { [key: string]: IFormData }) => {
        const stored = result[STORAGE_KEYS.formData]
        if (stored) {
          setFormData(stored)
        }
      },
    )
  }, [])
  return { formData, setFormData }
}
