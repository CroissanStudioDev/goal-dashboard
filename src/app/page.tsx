import { GoalProgress } from '@/components/GoalProgress'
import { TodayStats } from '@/components/TodayStats'
import { LiveIndicator } from '@/components/LiveIndicator'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute

export default async function DashboardPage() {
  // TODO: Fetch from API
  const mockData = {
    goal: {
      name: 'Выручка за март',
      target: 2_000_000,
      current: 1_247_500,
      currency: 'RUB',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    },
    today: {
      amount: 85_000,
      transactions: 3,
    },
    yesterday: {
      amount: 124_000,
      transactions: 5,
    },
    pace: {
      status: 'ahead' as const, // ahead | ontrack | behind | atrisk
      percentDiff: 8,
      forecastDate: '27 марта',
    },
  }

  return (
    <main className="min-h-screen p-8 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <h1 className="text-2xl text-gray-400">{mockData.goal.name}</h1>
        <LiveIndicator />
      </header>

      {/* Main progress */}
      <div className="flex-1 flex flex-col justify-center">
        <GoalProgress
          current={mockData.goal.current}
          target={mockData.goal.target}
          currency={mockData.goal.currency}
          pace={mockData.pace}
        />
      </div>

      {/* Footer stats */}
      <footer className="mt-8">
        <TodayStats
          today={mockData.today}
          yesterday={mockData.yesterday}
          currency={mockData.goal.currency}
        />
      </footer>
    </main>
  )
}
