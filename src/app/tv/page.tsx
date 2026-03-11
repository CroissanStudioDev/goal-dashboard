import { getGoalWithProgress } from '@/lib/goals'
import { TVDashboard } from './TVDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 30

export default async function TVPage() {
  const data = await getGoalWithProgress()
  
  if (!data) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <h1 className="text-4xl text-gray-600">Нет активных целей</h1>
      </main>
    )
  }
  
  return (
    <TVDashboard 
      data={{
        goal: {
          name: data.goal.name,
          currency: data.goal.currency,
          endDate: data.goal.endDate.toISOString(),
        },
        progress: {
          current: data.progress.current,
          target: data.progress.target,
          percent: data.progress.percent,
        },
        pace: data.pace,
        today: data.today,
        yesterday: data.yesterday,
      }} 
    />
  )
}
