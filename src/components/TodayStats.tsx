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
    <div className="flex justify-center gap-16 text-xl">
      <div className="text-center">
        <div className="text-gray-500 mb-1">Сегодня</div>
        <div className="text-4xl font-bold text-green-400">
          +{formatCurrency(today.amount, currency)}
        </div>
        <div className="text-gray-600 text-sm mt-1">
          {today.transactions} {pluralize(today.transactions, 'платёж', 'платежа', 'платежей')}
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-gray-500 mb-1">Вчера</div>
        <div className="text-4xl font-bold text-gray-400">
          +{formatCurrency(yesterday.amount, currency)}
        </div>
        <div className="text-gray-600 text-sm mt-1">
          {yesterday.transactions} {pluralize(yesterday.transactions, 'платёж', 'платежа', 'платежей')}
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
