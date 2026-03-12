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
  ahead: 'text-green-400',
  ontrack: 'text-blue-400',
  behind: 'text-yellow-400',
  atrisk: 'text-red-400',
}

const statusBgColors: Record<PaceStatus, string> = {
  ahead: 'bg-green-500',
  ontrack: 'bg-blue-500',
  behind: 'bg-yellow-500',
  atrisk: 'bg-red-500',
}

const statusLabels: Record<PaceStatus, string> = {
  ahead: '🚀 Опережаем',
  ontrack: '✓ По плану',
  behind: '⚠️ Отстаём',
  atrisk: '🔥 Под угрозой',
}

export function GoalProgress({
  current,
  target,
  currency,
  pace,
}: GoalProgressProps) {
  const percent = Math.min((current / target) * 100, 100)

  return (
    <div className="space-y-8">
      {/* Big number */}
      <div className="text-center">
        <div
          className={`text-7xl md:text-8xl lg:text-display-lg font-bold tabular-nums ${statusColors[pace.status]}`}
          style={{ textShadow: '0 0 40px currentColor' }}
        >
          {formatCurrency(current, currency)}
        </div>
        <div className="text-2xl md:text-3xl text-gray-500 mt-2">
          из {formatCurrency(target, currency)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative max-w-3xl mx-auto">
        <div className="h-6 md:h-8 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${statusBgColors[pace.status]} progress-bar rounded-full transition-all duration-1000`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
            {formatPercent(percent)}
          </span>
        </div>
      </div>

      {/* Pace indicator */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-12 text-xl md:text-2xl">
        <div className={statusColors[pace.status]}>
          {statusLabels[pace.status]}
          {pace.percentDiff !== 0 && (
            <span className="ml-2">
              {pace.percentDiff > 0 ? '+' : ''}
              {pace.percentDiff}%
            </span>
          )}
        </div>
        <div className="text-gray-400">
          Прогноз: достигнем{' '}
          <span className="text-white">{pace.forecastDate}</span>
        </div>
      </div>
    </div>
  )
}
