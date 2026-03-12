'use client'

import { useEffect, useState } from 'react'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useBankSync } from '@/hooks/useBankSync'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useSyncSettings } from '@/hooks/useSyncSettings'
import { formatCurrency, formatPercent } from '@/lib/format'

type PaceStatus = 'ahead' | 'ontrack' | 'behind' | 'atrisk'

interface TVData {
  goal: {
    name: string
    currency: string
    endDate: string
  }
  progress: {
    current: number
    target: number
    percent: number
  }
  pace: {
    status: PaceStatus
    percentDiff: number
    forecastDate: string
  }
  today: { amount: number; transactions: number }
  yesterday: { amount: number; transactions: number }
}

const statusColors: Record<PaceStatus, string> = {
  ahead: 'text-goal-ahead-text',
  ontrack: 'text-goal-ontrack-text',
  behind: 'text-goal-behind-text',
  atrisk: 'text-goal-atrisk-text',
}

const statusBgColors: Record<PaceStatus, string> = {
  ahead: 'bg-primary',
  ontrack: 'bg-primary',
  behind: 'bg-gray-400',
  atrisk: 'bg-danger',
}

const statusLabels: Record<PaceStatus, string> = {
  ahead: 'Опережаем',
  ontrack: 'По плану',
  behind: 'Отстаём',
  atrisk: 'Под угрозой',
}

function formatForecastDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

export function TVDashboard({ data }: { data: TVData }) {
  const { toggleFullscreen } = useFullscreen()
  const [time, setTime] = useState(new Date())

  useAutoRefresh(30_000)

  const { intervalMs, isEnabled, isLoaded } = useSyncSettings()
  const { isSyncing } = useBankSync({
    intervalMs,
    syncOnMount: true,
    enabled: isLoaded && isEnabled,
  })

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen])

  const { goal, progress, pace, today, yesterday } = data
  const percent = Math.min(progress.percent, 100)
  const roundedDiff = Math.round(pace.percentDiff * 10) / 10

  return (
    <main
      className="min-h-screen bg-bg p-12 flex flex-col cursor-pointer tv-mode"
      onClick={toggleFullscreen}
      onKeyDown={(e) => e.key === 'f' && toggleFullscreen()}
      role="button"
      tabIndex={0}
    >
      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-lg font-medium text-text-secondary">{goal.name}</h1>
        <div className="flex items-center gap-3 text-text-muted">
          <span
            className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-primary animate-pulse' : 'bg-success'}`}
          />
          <span className="text-2xl tabular-nums">
            {time.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <div
            className={`text-7xl md:text-8xl font-semibold tabular-nums tracking-tight ${statusColors[pace.status]}`}
          >
            {formatCurrency(progress.current, goal.currency)}
          </div>
          <div className="text-xl text-text-muted mt-3">
            из {formatCurrency(progress.target, goal.currency)}
          </div>
        </div>

        <div className="max-w-2xl mx-auto w-full">
          <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${statusBgColors[pace.status]} rounded-full transition-all duration-1000`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="text-center mt-4 text-sm text-text-muted">
            {formatPercent(percent)}
          </div>
        </div>

        <div className="text-center mt-8 text-text-secondary">
          <span className={`font-medium ${statusColors[pace.status]}`}>
            {statusLabels[pace.status]}
            {roundedDiff !== 0 && ` ${roundedDiff > 0 ? '+' : ''}${roundedDiff}%`}
          </span>
          <span className="mx-2">·</span>
          <span>Прогноз: {formatForecastDate(pace.forecastDate)}</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex justify-center gap-16 pt-8 border-t border-border">
        <div className="text-center">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
            Сегодня
          </div>
          <div className="text-2xl font-semibold text-success">
            +{formatCurrency(today.amount, goal.currency)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
            Вчера
          </div>
          <div className="text-2xl font-semibold text-text-secondary">
            +{formatCurrency(yesterday.amount, goal.currency)}
          </div>
        </div>
      </footer>
    </main>
  )
}
