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
  ahead: 'Ahead of schedule',
  ontrack: 'On track',
  behind: 'Behind schedule',
  atrisk: 'At risk',
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
    <div className="space-y-12">
      {/* Big number */}
      <div className="text-center">
        <div
          className={`text-6xl md:text-7xl lg:text-8xl font-semibold tabular-nums tracking-tight ${statusColors[pace.status]}`}
        >
          {formatCurrency(current, currency)}
        </div>
        <div className="text-xl md:text-2xl text-text-muted mt-3">
          of {formatCurrency(target, currency)}
        </div>
      </div>

      {/* Progress bar - minimal */}
      <div className="max-w-2xl mx-auto">
        <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${statusBgColors[pace.status]} rounded-full transition-all duration-1000`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-sm text-text-muted">
          <span>{formatPercent(percent)}</span>
          <span>{formatPercent(100)}</span>
        </div>
      </div>

      {/* Pace indicator - minimal */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-3 md:gap-8 text-base">
        <div className={`font-medium ${statusColors[pace.status]}`}>
          {statusLabels[pace.status]}
          {roundedDiff !== 0 && (
            <span className="ml-2 font-normal">
              {roundedDiff > 0 ? '+' : ''}
              {roundedDiff}%
            </span>
          )}
        </div>
        <span className="hidden md:inline text-text-subtle">|</span>
        <div className="text-text-secondary">
          Forecast:{' '}
          <span className="text-text font-medium">
            {formatForecastDate(pace.forecastDate)}
          </span>
        </div>
      </div>
    </div>
  )
}
