import { redirect } from 'next/navigation'
import { AutoRefresh } from '@/components/AutoRefresh'
import { Dashboard } from '@/components/Dashboard'
import { SyncStatus } from '@/components/SyncStatus'
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
        <a
          href="/setup"
          className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-medium transition-colors"
        >
          Создать цель
        </a>
      </main>
    )
  }

  const [progress, dayStats] = await Promise.all([
    calculateGoalProgress(goal, userId),
    getDayStats(goal, userId),
  ])

  const pace = calculatePace(goal, progress)

  return (
    <>
      <AutoRefresh intervalMs={60_000} />
      <SyncStatus />
      <Dashboard
        goal={{
          name: goal.name,
          currency: goal.currency,
        }}
        progress={progress}
        pace={pace}
        today={dayStats.today}
        yesterday={dayStats.yesterday}
      />
    </>
  )
}
