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
  ahead: 'text-goal-ahead',
  ontrack: 'text-goal-ontrack',
  behind: 'text-goal-behind',
  atrisk: 'text-goal-atrisk',
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

export function GoalProgress({ current, target, currency, pace }: GoalProgressProps) {
  const percent = Math.min((current / target) * 100, 100)
  
  return (
    <div className="space-y-8">
      {/* Big number */}
      <div className="text-center">
        <div className={`text-display-lg font-bold tabular-nums ${statusColors[pace.status]} glow`}>
          {formatCurrency(current, currency)}
        </div>
        <div className="text-3xl text-gray-500 mt-2">
          из {formatCurrency(target, currency)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-8 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${statusBgColors[pace.status]} progress-bar rounded-full`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white drop-shadow-lg">
            {formatPercent(percent)}
          </span>
        </div>
      </div>

      {/* Pace indicator */}
      <div className="flex justify-center gap-12 text-2xl">
        <div className={statusColors[pace.status]}>
          {statusLabels[pace.status]}
          {pace.percentDiff > 0 && ` +${pace.percentDiff}%`}
          {pace.percentDiff < 0 && ` ${pace.percentDiff}%`}
        </div>
        <div className="text-gray-400">
          Прогноз: достигнем <span className="text-white">{pace.forecastDate}</span>
        </div>
      </div>
    </div>
  )
}
