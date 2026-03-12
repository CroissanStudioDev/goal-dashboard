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
    <div className="flex justify-center gap-12 md:gap-20">
      <div className="text-center">
        <div className="text-sm text-text-muted mb-2 uppercase tracking-wide">
          Today
        </div>
        <div className="text-2xl md:text-3xl font-semibold text-success">
          +{formatCurrency(today.amount, currency)}
        </div>
        <div className="text-text-subtle text-sm mt-1">
          {today.transactions}{' '}
          {pluralize(today.transactions, 'payment', 'payments', 'payments')}
        </div>
      </div>

      <div className="w-px bg-border" />

      <div className="text-center">
        <div className="text-sm text-text-muted mb-2 uppercase tracking-wide">
          Yesterday
        </div>
        <div className="text-2xl md:text-3xl font-semibold text-text-secondary">
          +{formatCurrency(yesterday.amount, currency)}
        </div>
        <div className="text-text-subtle text-sm mt-1">
          {yesterday.transactions}{' '}
          {pluralize(yesterday.transactions, 'payment', 'payments', 'payments')}
        </div>
      </div>
    </div>
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
