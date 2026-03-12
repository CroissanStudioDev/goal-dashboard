'use client'

import { useEffect, useState } from 'react'
import { useFullscreen } from '@/hooks/useFullscreen'
import { formatCurrency, formatPercent } from '@/lib/format'
import { UserMenu } from './UserMenu'

type PaceStatus = 'ahead' | 'ontrack' | 'behind' | 'atrisk'

interface DashboardProps {
  goal: {
    name: string
    currency: string
  }
  progress: {
    current: number
    target: number
  }
  pace: {
    status: PaceStatus
    percentDiff: number
    forecastDate: string
  }
  today: { amount: number }
  yesterday: { amount: number }
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
  const date = new Date(isoDate)
  const currentYear = new Date().getFullYear()
  const forecastYear = date.getFullYear()

  if (forecastYear === currentYear) {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    })
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function Dashboard({
  goal,
  progress,
  pace,
  today,
  yesterday,
}: DashboardProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') toggleFullscreen()
      if (e.key === 'Escape' && isFullscreen) toggleFullscreen()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen, isFullscreen])

  const percent = Math.min((progress.current / progress.target) * 100, 100)
  const roundedDiff = Math.round(pace.percentDiff * 10) / 10

  return (
    <main
      className={`min-h-screen flex flex-col transition-all duration-300 ${
        isFullscreen ? 'p-12 cursor-pointer' : 'p-8 md:p-12'
      }`}
      onClick={isFullscreen ? toggleFullscreen : undefined}
      role={isFullscreen ? 'button' : undefined}
      tabIndex={isFullscreen ? 0 : undefined}
    >
      {/* Header - скрыт в fullscreen */}
      {!isFullscreen && (
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-lg font-medium text-text-secondary">
            {goal.name}
          </h1>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={toggleFullscreen}
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Fullscreen
            </button>
            <a
              href="/settings"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Настройки
            </a>
            <UserMenu />
          </div>
        </header>
      )}

      {/* Время в fullscreen */}
      {isFullscreen && (
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-lg font-medium text-text-secondary">
            {goal.name}
          </h1>
          <div className="text-2xl tabular-nums text-text-muted">{time}</div>
        </header>
      )}

      {/* Main progress */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="space-y-10">
          {/* Big number */}
          <div className="text-center">
            <div
              className={`font-semibold tabular-nums tracking-tight ${statusColors[pace.status]} ${
                isFullscreen
                  ? 'text-7xl md:text-8xl'
                  : 'text-5xl md:text-6xl lg:text-7xl'
              }`}
            >
              {formatCurrency(progress.current, goal.currency)}
            </div>
            <div
              className={`text-text-muted mt-2 ${isFullscreen ? 'text-xl' : 'text-lg'}`}
            >
              из {formatCurrency(progress.target, goal.currency)}
            </div>
          </div>

          {/* Progress bar */}
          <div className={isFullscreen ? 'max-w-2xl mx-auto' : 'max-w-xl mx-auto'}>
            <div
              className={`bg-bg-muted rounded-full overflow-hidden ${isFullscreen ? 'h-2' : 'h-1.5'}`}
            >
              <div
                className={`h-full ${statusBgColors[pace.status]} rounded-full transition-all duration-1000`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="text-center mt-4 text-sm text-text-muted">
              {formatPercent(percent)}
            </div>
          </div>

          {/* Status */}
          <div
            className={`text-center text-text-secondary ${isFullscreen ? 'text-base' : 'text-sm'}`}
          >
            <span className={`font-medium ${statusColors[pace.status]}`}>
              {statusLabels[pace.status]}
              {roundedDiff !== 0 &&
                ` ${roundedDiff > 0 ? '+' : ''}${roundedDiff}%`}
            </span>
            <span className="mx-2">·</span>
            <span>Прогноз: {formatForecastDate(pace.forecastDate)}</span>
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <footer
        className={`pt-8 border-t border-border ${isFullscreen ? 'mt-12' : 'mt-16'}`}
      >
        <div className="flex justify-center gap-16">
          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
              Сегодня
            </div>
            <div
              className={`font-semibold text-success ${isFullscreen ? 'text-2xl' : 'text-xl'}`}
            >
              +{formatCurrency(today.amount, goal.currency)}
            </div>
          </div>

          <div className="text-center">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
              Вчера
            </div>
            <div
              className={`font-semibold text-text-secondary ${isFullscreen ? 'text-2xl' : 'text-xl'}`}
            >
              +{formatCurrency(yesterday.amount, goal.currency)}
            </div>
          </div>
        </div>
      </footer>

      {/* Подсказка в fullscreen */}
      {isFullscreen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-text-subtle">
          Нажмите ESC или кликните для выхода
        </div>
      )}
    </main>
  )
}
