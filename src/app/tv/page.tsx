import { redirect } from 'next/navigation'
import {
  calculateGoalProgress,
  calculatePace,
  getActiveGoal,
  getDayStats,
} from '@/lib/goals'
import { getAuthSession } from '@/lib/session'
import { TVDashboard } from './TVDashboard'

export const dynamic = 'force-dynamic'

export default async function TVPage() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/sign-in?callbackUrl=/tv')
  }

  const userId = session.user.id
  const goal = await getActiveGoal(userId)

  if (!goal) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-xl text-text-muted">Нет активной цели</p>
      </main>
    )
  }

  const [progress, dayStats] = await Promise.all([
    calculateGoalProgress(goal, userId),
    getDayStats(goal, userId),
  ])

  const pace = calculatePace(goal, progress)

  return (
    <TVDashboard
      data={{
        goal: {
          name: goal.name,
          currency: goal.currency,
          endDate: goal.endDate.toISOString(),
        },
        progress,
        pace,
        today: dayStats.today,
        yesterday: dayStats.yesterday,
      }}
    />
  )
}
