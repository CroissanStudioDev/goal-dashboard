'use client'

import { useState } from 'react'
import { useSyncSettings } from '@/hooks/useSyncSettings'

export function SyncSettings() {
  const { intervalMinutes, setInterval, isLoaded } = useSyncSettings()
  const [inputValue, setInputValue] = useState('')

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
      <label className="block text-sm text-text-secondary">
        Auto-sync interval (minutes)
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min="0"
          value={displayValue}
          onChange={handleChange}
          onBlur={() => setInputValue('')}
          placeholder="10"
          className="w-24 px-4 py-3 bg-bg-muted rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        />
        <span className="text-text-muted text-sm">min</span>
        {intervalMinutes === 0 && (
          <span className="text-text-subtle text-sm">Disabled</span>
        )}
      </div>
      <p className="text-xs text-text-muted">
        {intervalMinutes > 0
          ? `Transactions will sync every ${intervalMinutes} min while dashboard is open.`
          : 'Auto-sync is disabled. Use the button below for manual sync.'}
      </p>
    </div>
  )
}
