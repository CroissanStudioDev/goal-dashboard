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
    <div className="flex justify-center gap-8 md:gap-16 text-lg md:text-xl">
      <div className="text-center">
        <div className="text-text-muted mb-1">Сегодня</div>
        <div className="text-3xl md:text-4xl font-bold text-success-text">
          +{formatCurrency(today.amount, currency)}
        </div>
        <div className="text-text-subtle text-sm mt-1">
          {today.transactions}{' '}
          {pluralize(today.transactions, 'платёж', 'платежа', 'платежей')}
        </div>
      </div>

      <div className="text-center">
        <div className="text-text-muted mb-1">Вчера</div>
        <div className="text-3xl md:text-4xl font-bold text-text-secondary">
          +{formatCurrency(yesterday.amount, currency)}
        </div>
        <div className="text-text-subtle text-sm mt-1">
          {yesterday.transactions}{' '}
          {pluralize(yesterday.transactions, 'платёж', 'платежа', 'платежей')}
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
