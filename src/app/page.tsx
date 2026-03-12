import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AutoRefresh } from '@/components/AutoRefresh'
import { GoalProgress } from '@/components/GoalProgress'
import { LiveIndicator } from '@/components/LiveIndicator'
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
        <h1 className="text-3xl font-semibold mb-4">Goal Dashboard</h1>
        <p className="text-text-secondary text-lg mb-8">No active goals</p>
        <div className="flex gap-4">
          <Link
            href="/setup"
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-medium transition-colors"
          >
            Create Goal
          </Link>
          <Link
            href="/settings"
            className="px-6 py-3 border border-border hover:border-primary text-text rounded-full font-medium transition-colors"
          >
            Settings
          </Link>
        </div>
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
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-xl font-medium text-text">{goal.name}</h1>
          <p className="text-sm text-text-muted mt-1">
            {new Date(goal.startDate).toLocaleDateString('ru-RU')} —{' '}
            {new Date(goal.endDate).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <LiveIndicator />
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/tv"
              className="text-text-muted hover:text-text transition-colors"
            >
              TV
            </Link>
            <Link
              href="/transactions"
              className="text-text-muted hover:text-text transition-colors"
            >
              Transactions
            </Link>
            <Link
              href="/settings"
              className="text-text-muted hover:text-text transition-colors"
            >
              Settings
            </Link>
          </nav>
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
      <footer className="mt-12 pt-8 border-t border-border">
        <TodayStats
          today={dayStats.today}
          yesterday={dayStats.yesterday}
          currency={goal.currency}
        />
      </footer>
    </main>
  )
}
