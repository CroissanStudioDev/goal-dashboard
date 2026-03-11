import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/session'
import { getActiveGoal, calculateGoalProgress, calculatePace, getDayStats } from '@/lib/goals'
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
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-4xl text-gray-500">Нет активной цели</p>
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
      goal={{
        name: goal.name,
        currency: goal.currency,
        startDate: goal.startDate.toISOString(),
        endDate: goal.endDate.toISOString(),
      }}
      progress={progress}
      pace={pace}
      dayStats={dayStats}
    />
  )
}
