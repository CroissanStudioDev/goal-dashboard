'use client'

import { formatCurrency, formatPercent } from '@/lib/format'

type PaceStatus = 'ahead' | 'ontrack' | 'behind' | 'atrisk'

interface GoalProgressProps {
  current: number
  target: number
  currency: string
  pace: {
    status: PaceStatus
    percentDiff: number
    forecastDate: string
  }
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
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

export function GoalProgress({
  current,
  target,
  currency,
  pace,
}: GoalProgressProps) {
  const percent = Math.min((current / target) * 100, 100)
  const roundedDiff = Math.round(pace.percentDiff * 10) / 10

  return (
    <div className="space-y-10">
      {/* Big number */}
      <div className="text-center">
        <div
          className={`text-5xl md:text-6xl lg:text-7xl font-semibold tabular-nums tracking-tight ${statusColors[pace.status]}`}
        >
          {formatCurrency(current, currency)}
        </div>
        <div className="text-lg text-text-muted mt-2">
          из {formatCurrency(target, currency)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="max-w-xl mx-auto">
        <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
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
      <div className="text-center text-sm text-text-secondary">
        <span className={`font-medium ${statusColors[pace.status]}`}>
          {statusLabels[pace.status]}
          {roundedDiff !== 0 && ` ${roundedDiff > 0 ? '+' : ''}${roundedDiff}%`}
        </span>
        <span className="mx-2">·</span>
        <span>Прогноз: {formatForecastDate(pace.forecastDate)}</span>
      </div>
    </div>
  )
}
