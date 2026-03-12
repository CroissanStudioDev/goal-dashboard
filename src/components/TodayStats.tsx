'use client'

import { formatCurrency } from '@/lib/format'

interface DayStats {
  amount: number
  transactions: number
}

interface TodayStatsProps {
  today: DayStats
  yesterday: DayStats
  currency: string
}

export function TodayStats({ today, yesterday, currency }: TodayStatsProps) {
  return (
    <div className="flex justify-center gap-16">
      <div className="text-center">
        <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
          Сегодня
        </div>
        <div className="text-xl font-semibold text-success">
          +{formatCurrency(today.amount, currency)}
        </div>
      </div>

      <div className="text-center">
        <div className="text-xs text-text-muted uppercase tracking-wider mb-2">
          Вчера
        </div>
        <div className="text-xl font-semibold text-text-secondary">
          +{formatCurrency(yesterday.amount, currency)}
        </div>
      </div>
    </div>
  )
}
