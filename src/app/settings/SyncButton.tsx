'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui'

export function SyncButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setResult({
            success: false,
            message: `Слишком много запросов. Подождите ${data.retryAfter || 60} сек.`,
          })
        } else {
          setResult({
            success: false,
            message: data.error || 'Ошибка синхронизации',
          })
        }
        return
      }

      const added = data.totalAdded || 0
      const synced =
        data.results?.filter((r: { status: string }) => r.status === 'success')
          .length || 0

      setResult({
        success: true,
        message: `Синхронизировано ${synced} счёт(ов), добавлено ${added} транзакций`,
      })

      router.refresh()
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleSync} disabled={loading} variant="secondary">
        {loading ? 'Синхронизация...' : 'Синхронизировать сейчас'}
      </Button>

      {result && (
        <p
          className={
            result.success ? 'text-success-text text-sm' : 'text-danger-text text-sm'
          }
        >
          {result.message}
        </p>
      )}
    </div>
  )
}
