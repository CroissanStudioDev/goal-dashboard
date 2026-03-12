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
  today: {
    amount: number
    transactions: number
  }
  yesterday: {
    amount: number
    transactions: number
  }
}

interface TVDashboardProps {
  data: TVData
}

const statusColors: Record<PaceStatus, string> = {
  ahead: 'text-goal-ahead-text',
  ontrack: 'text-goal-ontrack-text',
  behind: 'text-goal-behind-text',
  atrisk: 'text-goal-atrisk-text',
}

const statusBgColors: Record<PaceStatus, string> = {
  ahead: 'bg-goal-ahead',
  ontrack: 'bg-goal-ontrack',
  behind: 'bg-goal-behind',
  atrisk: 'bg-goal-atrisk',
}

const statusLabels: Record<PaceStatus, string> = {
  ahead: '🚀 Опережаем',
  ontrack: '✓ По плану',
  behind: '⚠️ Отстаём',
  atrisk: '🔥 Под угрозой',
}

export function TVDashboard({ data }: TVDashboardProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const [time, setTime] = useState(new Date())

  // Auto-refresh page every 30 seconds
  useAutoRefresh(30_000)

  // Sync banks based on user settings
  const { intervalMs, isEnabled, isLoaded } = useSyncSettings()
  const { isSyncing, lastSync: _lastSync } = useBankSync({
    intervalMs,
    syncOnMount: true,
    enabled: isLoaded && isEnabled,
  })

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Global keyboard handler for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen])

  const { goal, progress, pace, today, yesterday } = data
  const percent = Math.min(progress.percent, 100)

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: TV dashboard uses global keyboard listener
    <main
      className="min-h-screen bg-black p-8 flex flex-col cursor-pointer tv-mode"
      onClick={toggleFullscreen}
    >
      {/* Header */}
      <header className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl text-text-secondary">{goal.name}</h1>
          <p className="text-text-subtle text-lg">
            до{' '}
            {new Date(goal.endDate).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono text-text-secondary">
            {time.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="flex items-center gap-2 text-text-muted justify-end">
            <span
              className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-warning animate-pulse' : 'bg-success'}`}
            />
            <span className="text-sm">{isSyncing ? 'SYNC' : 'LIVE'}</span>
            {!isFullscreen && (
              <span className="text-xs text-text-subtle ml-2">
                (клик для fullscreen)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Big number */}
        <div className="text-center mb-8">
          <div
            className={`text-[10rem] leading-none font-bold tabular-nums ${statusColors[pace.status]}`}
            style={{ textShadow: '0 0 60px currentColor' }}
          >
            {formatCurrency(progress.current, goal.currency)}
          </div>
          <div className="text-4xl text-text-muted mt-4">
            из {formatCurrency(progress.target, goal.currency)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mx-auto w-full max-w-4xl">
          <div className="h-12 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className={`h-full ${statusBgColors[pace.status]} transition-all duration-1000 rounded-full`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-text drop-shadow-lg">
              {formatPercent(percent)}
            </span>
          </div>
        </div>

        {/* Pace */}
        <div className="text-center mt-8 text-3xl">
          <span className={statusColors[pace.status]}>
            {statusLabels[pace.status]}
            {pace.percentDiff !== 0 && (
              <span className="ml-2">
                {pace.percentDiff > 0 ? '+' : ''}
                {pace.percentDiff}%
              </span>
            )}
          </span>
          <span className="text-text-muted mx-4">•</span>
          <span className="text-text-secondary">
            Прогноз: <span className="text-text">{pace.forecastDate}</span>
          </span>
        </div>
      </div>

      {/* Footer stats */}
      <footer className="flex justify-center gap-24 text-2xl pt-8 border-t border-border">
        <div className="text-center">
          <div className="text-text-muted mb-2">Сегодня</div>
          <div className="text-5xl font-bold text-success-text">
            +{formatCurrency(today.amount, goal.currency)}
          </div>
          <div className="text-text-subtle mt-1">
            {today.transactions}{' '}
            {pluralize(today.transactions, 'платёж', 'платежа', 'платежей')}
          </div>
        </div>

        <div className="text-center">
          <div className="text-text-muted mb-2">Вчера</div>
          <div className="text-5xl font-bold text-text-secondary">
            +{formatCurrency(yesterday.amount, goal.currency)}
          </div>
          <div className="text-text-subtle mt-1">
            {yesterday.transactions}{' '}
            {pluralize(yesterday.transactions, 'платёж', 'платежа', 'платежей')}
          </div>
        </div>
      </footer>
    </main>
  )
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100

  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}
