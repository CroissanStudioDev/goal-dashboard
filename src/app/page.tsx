import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AutoRefresh } from '@/components/AutoRefresh'
import { GoalProgress } from '@/components/GoalProgress'
import { SyncStatus } from '@/components/SyncStatus'
import { TodayStats } from '@/components/TodayStats'
import { UserMenu } from '@/components/UserMenu'
import {
  calculateGoalProgress,
  calculatePace,
  getActiveGoal,
  getDayStats,
} from '@/lib/goals'
import { getAuthSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/sign-in')
  }

  const userId = session.user.id
  const goal = await getActiveGoal(userId)

  if (!goal) {
    return (
      <main className="min-h-screen p-8 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-3">Нет активных целей</h1>
        <p className="text-text-muted mb-8">Создайте цель для отслеживания</p>
        <Link
          href="/setup"
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-medium transition-colors"
        >
          Создать цель
        </Link>
      </main>
    )
  }

  const [progress, dayStats] = await Promise.all([
    calculateGoalProgress(goal, userId),
    getDayStats(goal, userId),
  ])

  const pace = calculatePace(goal, progress)

  return (
    <main className="min-h-screen p-8 md:p-12 flex flex-col">
      <AutoRefresh intervalMs={60_000} />
      <SyncStatus />

      {/* Header */}
      <header className="flex justify-between items-center mb-16">
        <h1 className="text-lg font-medium text-text-secondary">{goal.name}</h1>
        <div className="flex items-center gap-6">
          <Link
            href="/settings"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            Настройки
          </Link>
          <UserMenu />
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
      <footer className="mt-16 pt-8 border-t border-border">
        <TodayStats
          today={dayStats.today}
          yesterday={dayStats.yesterday}
          currency={goal.currency}
        />
      </footer>
    </main>
  )
}
