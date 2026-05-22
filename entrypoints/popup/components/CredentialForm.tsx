import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Save, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { STORAGE_KEYS } from '@/utils/constants'
import { useStorage } from '@/entrypoints/hooks/useStorage'

type FormData = {
  apiUrl: string
  apiKey: string
}

const CredentialForm: React.FC<{
  children?: React.ReactNode
}> = () => {
  const [showApiKey, setShowApiKey] = useState(false)
  const { register, handleSubmit, setValue } = useForm<FormData>()

  const [formData, setFormData] = useStorage<FormData>(STORAGE_KEYS.formData)

  if (formData) {
    setValue('apiUrl', formData.apiUrl)
    setValue('apiKey', formData.apiKey)
  }

  const onSubmit = (data: FormData) => {
    setFormData(data)
    toast.success('设置已保存', { position: 'top-center' })
  }

  return (
    <div className="p-4 min-w-90">
      {/* 顶栏：标题 + 跳转提示词管理 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">API 凭证设置</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            browser.runtime.sendMessage({ action: 'openOptionsPage' })
          }}
          className="gap-1 text-xs"
        >
          <ExternalLink className="size-3.5" />
          提示词管理
        </Button>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            API URL
          </label>
          <input
            type="url"
            placeholder="https://api.example.com/v1"
            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            required
            {...register('apiUrl')}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-xxxxxxxxxxxxxx"
              className="w-full px-3 py-2 pr-10 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              required
              {...register('apiKey')}
            />
            <button
              type="button"
              onClick={() => setShowApiKey((prev) => !prev)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full">
          <Save />
          保存设置
        </Button>
      </form>
    </div>
  )
}

export default CredentialForm
