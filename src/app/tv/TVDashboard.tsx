'use client'

import { useEffect, useState } from 'react'
import { useFullscreen } from '@/hooks/useFullscreen'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import { useBankSync } from '@/hooks/useBankSync'
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

export function TVDashboard({ data }: TVDashboardProps) {
  const { isFullscreen, toggleFullscreen } = useFullscreen()
  const [time, setTime] = useState(new Date())
  
  // Auto-refresh page every 30 seconds
  useAutoRefresh(30_000)
  
  // Sync banks every 10 minutes while TV is open
  const { isSyncing, lastSync } = useBankSync({
    intervalMs: 10 * 60 * 1000,
    syncOnMount: true,
  })
  
  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  
  const { goal, progress, pace, today, yesterday } = data
  const percent = Math.min(progress.percent, 100)
  
  return (
    <main 
      className="min-h-screen bg-black p-8 flex flex-col cursor-pointer tv-mode"
      onClick={toggleFullscreen}
    >
      {/* Header */}
      <header className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl text-gray-400">{goal.name}</h1>
          <p className="text-gray-600 text-lg">
            до {new Date(goal.endDate).toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono text-gray-300">
            {time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-2 text-gray-500 justify-end">
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-sm">
              {isSyncing ? 'SYNC' : 'LIVE'}
            </span>
            {!isFullscreen && (
              <span className="text-xs text-gray-600 ml-2">
                (клик для fullscreen)
              </span>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Big number */}
        <div className="text-center mb-8">
          <div className={`text-[10rem] leading-none font-bold tabular-nums ${statusColors[pace.status]}`}
               style={{ textShadow: '0 0 60px currentColor' }}>
            {formatCurrency(progress.current, goal.currency)}
          </div>
          <div className="text-4xl text-gray-500 mt-4">
            из {formatCurrency(progress.target, goal.currency)}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative mx-auto w-full max-w-4xl">
          <div className="h-12 bg-gray-900 rounded-full overflow-hidden">
            <div
              className={`h-full ${statusBgColors[pace.status]} transition-all duration-1000 rounded-full`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-white drop-shadow-lg">
              {formatPercent(percent)}
            </span>
          </div>
        </div>
        
        {/* Pace */}
        <div className="text-center mt-8 text-3xl">
          <span className={statusColors[pace.status]}>
            {statusLabels[pace.status]}
            {pace.percentDiff !== 0 && (
              <span className="ml-2">
                {pace.percentDiff > 0 ? '+' : ''}{pace.percentDiff}%
              </span>
            )}
          </span>
          <span className="text-gray-500 mx-4">•</span>
          <span className="text-gray-400">
            Прогноз: <span className="text-white">{pace.forecastDate}</span>
          </span>
        </div>
      </div>
      
      {/* Footer stats */}
      <footer className="flex justify-center gap-24 text-2xl pt-8 border-t border-gray-900">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Сегодня</div>
          <div className="text-5xl font-bold text-green-400">
            +{formatCurrency(today.amount, goal.currency)}
          </div>
          <div className="text-gray-600 mt-1">
            {today.transactions} {pluralize(today.transactions, 'платёж', 'платежа', 'платежей')}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-gray-500 mb-2">Вчера</div>
          <div className="text-5xl font-bold text-gray-400">
            +{formatCurrency(yesterday.amount, goal.currency)}
          </div>
          <div className="text-gray-600 mt-1">
            {yesterday.transactions} {pluralize(yesterday.transactions, 'платёж', 'платежа', 'платежей')}
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
