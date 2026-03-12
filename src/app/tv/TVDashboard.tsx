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
  ahead: 'bg-primary',
  ontrack: 'bg-primary',
  behind: 'bg-gray-400',
  atrisk: 'bg-danger',
}

const statusLabels: Record<PaceStatus, string> = {
  ahead: 'Ahead',
  ontrack: 'On track',
  behind: 'Behind',
  atrisk: 'At risk',
}

function formatForecastDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

export function TVDashboard({ data }: TVDashboardProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen()
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
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-medium text-text">{goal.name}</h1>
          <p className="text-text-muted text-lg mt-1">
            until{' '}
            {new Date(goal.endDate).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-light text-text tabular-nums">
            {time.toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div className="flex items-center gap-2 text-text-muted justify-end mt-2">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${isSyncing ? 'bg-primary animate-pulse' : 'bg-success'}`}
            />
            <span className="text-sm">{isSyncing ? 'Syncing' : 'Live'}</span>
            {!isFullscreen && (
              <span className="text-xs text-text-subtle ml-2">
                (click for fullscreen)
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Big number */}
        <div className="text-center mb-12">
          <div
            className={`text-[8rem] md:text-[10rem] leading-none font-semibold tabular-nums tracking-tight ${statusColors[pace.status]}`}
          >
            {formatCurrency(progress.current, goal.currency)}
          </div>
          <div className="text-3xl text-text-muted mt-6">
            of {formatCurrency(progress.target, goal.currency)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-auto w-full max-w-4xl">
          <div className="h-3 bg-bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${statusBgColors[pace.status]} transition-all duration-1000 rounded-full`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-lg text-text-muted">
            <span>{formatPercent(percent)}</span>
            <span>100%</span>
          </div>
        </div>

        {/* Pace */}
        <div className="text-center mt-12 text-2xl">
          <span className={`font-medium ${statusColors[pace.status]}`}>
            {statusLabels[pace.status]}
            {roundedDiff !== 0 && (
              <span className="ml-2 font-normal">
                {roundedDiff > 0 ? '+' : ''}
                {roundedDiff}%
              </span>
            )}
          </span>
          <span className="text-text-subtle mx-6">|</span>
          <span className="text-text-secondary">
            Forecast:{' '}
            <span className="text-text font-medium">
              {formatForecastDate(pace.forecastDate)}
            </span>
          </span>
        </div>
      </div>

      {/* Footer stats */}
      <footer className="flex justify-center gap-24 text-xl pt-12 border-t border-border">
        <div className="text-center">
          <div className="text-text-muted mb-2 text-sm uppercase tracking-wide">
            Today
          </div>
          <div className="text-4xl font-semibold text-success">
            +{formatCurrency(today.amount, goal.currency)}
          </div>
          <div className="text-text-subtle mt-2">
            {today.transactions}{' '}
            {pluralize(today.transactions, 'payment', 'payments', 'payments')}
          </div>
        </div>

        <div className="w-px bg-border" />

        <div className="text-center">
          <div className="text-text-muted mb-2 text-sm uppercase tracking-wide">
            Yesterday
          </div>
          <div className="text-4xl font-semibold text-text-secondary">
            +{formatCurrency(yesterday.amount, goal.currency)}
          </div>
          <div className="text-text-subtle mt-2">
            {yesterday.transactions}{' '}
            {pluralize(
              yesterday.transactions,
              'payment',
              'payments',
              'payments',
            )}
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
