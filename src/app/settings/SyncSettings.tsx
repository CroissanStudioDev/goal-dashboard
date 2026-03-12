'use client'

import { useState } from 'react'
import { useSyncSettings } from '@/hooks/useSyncSettings'

export function SyncSettings() {
  const { intervalMinutes, setInterval, isLoaded } = useSyncSettings()
  const [inputValue, setInputValue] = useState('')

  if (!isLoaded) {
    return <div className="h-10 bg-bg-muted rounded animate-pulse" />
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      setInterval(num)
    } else if (value === '') {
      setInterval(0)
    }
  }

  const displayValue = inputValue !== '' ? inputValue : String(intervalMinutes)

  return (
    <div className="space-y-3">
      <label className="block text-sm text-text-secondary">
        Интервал автосинхронизации (минуты)
      </label>
      <div className="flex items-center gap-3">
        <input
          type="number"
          min="0"
          value={displayValue}
          onChange={handleChange}
          onBlur={() => setInputValue('')}
          placeholder="10"
          className="w-24 px-3 py-2 bg-bg-muted border border-border-muted rounded-lg text-text focus:outline-none focus:border-primary"
        />
        <span className="text-text-muted">мин</span>
        {intervalMinutes === 0 && (
          <span className="text-warning-text text-sm">Отключено</span>
        )}
      </div>
      <p className="text-xs text-text-muted">
        {intervalMinutes > 0
          ? `Транзакции будут синхронизироваться каждые ${intervalMinutes} мин пока открыт дашборд.`
          : 'Автоматическая синхронизация отключена. Используйте кнопку ниже для ручной синхронизации.'}
      </p>
    </div>
  )
}
