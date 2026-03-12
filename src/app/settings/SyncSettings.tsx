'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSyncSettings } from '@/hooks/useSyncSettings'

export function SyncSettings() {
  const router = useRouter()
  const { intervalMinutes, setInterval, isLoaded } = useSyncSettings()
  const [inputValue, setInputValue] = useState('')
  const [syncing, setSyncing] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/sync', { method: 'POST', credentials: 'include' })
      router.refresh()
    } finally {
      setSyncing(false)
    }
  }

  if (!isLoaded) {
    return <div className="h-10 bg-bg-muted rounded-xl animate-pulse" />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    const num = parseInt(value, 10)
    if (!Number.isNaN(num) && num >= 0) {
      setInterval(num)
    } else if (value === '') {
      setInterval(0)
    }
  }

  const displayValue = inputValue !== '' ? inputValue : String(intervalMinutes)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={displayValue}
            onChange={handleChange}
            onBlur={() => setInputValue('')}
            placeholder="10"
            className="w-16 px-3 py-2 bg-bg-elevated rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
          <span className="text-sm text-text-muted">мин</span>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="text-sm text-primary hover:text-primary-hover disabled:opacity-50 transition-colors"
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать'}
        </button>
      </div>
      <p className="text-xs text-text-muted">
        {intervalMinutes > 0
          ? `Автосинхронизация каждые ${intervalMinutes} мин`
          : 'Автосинхронизация отключена'}
      </p>
    </div>
  )
}
