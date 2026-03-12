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
            message: `Too many requests. Wait ${data.retryAfter || 60}s.`,
          })
        } else {
          setResult({
            success: false,
            message: data.error || 'Sync failed',
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
        message: `Synced ${synced} account(s), added ${added} transactions`,
      })

      router.refresh()
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={handleSync} disabled={loading} variant="secondary">
        {loading ? 'Syncing...' : 'Sync Now'}
      </Button>

      {result && (
        <p
          className={`text-sm ${result.success ? 'text-success' : 'text-danger'}`}
        >
          {result.message}
        </p>
      )}
    </div>
  )
}
