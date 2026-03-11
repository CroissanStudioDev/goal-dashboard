import { getActiveGoal, calculateGoalProgress, calculatePace, getDayStats } from '@/lib/goals'
import { GoalProgress } from '@/components/GoalProgress'
import { TodayStats } from '@/components/TodayStats'
import { LiveIndicator } from '@/components/LiveIndicator'
import { AutoRefresh } from '@/components/AutoRefresh'
import { SyncStatus } from '@/components/SyncStatus'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const goal = await getActiveGoal()
  
  if (!goal) {
    return (
      <main className="min-h-screen p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">🎯 Goal Dashboard</h1>
        <p className="text-gray-400 text-xl mb-8">Нет активных целей</p>
        <div className="flex gap-4">
          <Link 
            href="/setup" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg"
          >
            Создать цель
          </Link>
          <Link 
            href="/settings" 
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-lg"
          >
            Настройки
          </Link>
        </div>
      </main>
    )
  }
  
  const [progress, dayStats] = await Promise.all([
    calculateGoalProgress(goal),
    getDayStats(goal),
  ])
  
  const pace = calculatePace(goal, progress)

  return (
    <main className="min-h-screen p-8 flex flex-col">
      {/* Auto-refresh UI every minute, sync banks every 10 min */}
      <AutoRefresh intervalMs={60_000} />
      <SyncStatus intervalMinutes={10} />
      
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl text-gray-400">{goal.name}</h1>
          <p className="text-sm text-gray-600">
            {new Date(goal.startDate).toLocaleDateString('ru-RU')} — {new Date(goal.endDate).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <LiveIndicator />
          <Link href="/tv" className="text-gray-500 hover:text-white text-sm">
            📺 TV
          </Link>
          <Link href="/transactions" className="text-gray-500 hover:text-white text-sm">
            💰
          </Link>
          <Link href="/settings" className="text-gray-500 hover:text-white text-sm">
            ⚙️
          </Link>
        </div>
      </header>

      {/* Main progress */}
      <div className="flex-1 flex flex-col justify-center">
        <GoalProgress
          current={progress.current}
          target={progress.target}
          currency={goal.currency}
          pace={pace}
        />
      </div>

      {/* Footer stats */}
      <footer className="mt-8">
        <TodayStats
          today={dayStats.today}
          yesterday={dayStats.yesterday}
          currency={goal.currency}
        />
      </footer>
    </main>
  )
}
