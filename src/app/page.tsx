import { GoalProgress } from '@/components/GoalProgress'
import { TodayStats } from '@/components/TodayStats'
import { LiveIndicator } from '@/components/LiveIndicator'
import { prisma } from '@/lib/db'
import { startOfDay, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute

async function getActiveGoal() {
  return prisma.goal.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

async function getGoalProgress(goalId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
  })
  
  if (!goal) return null
  
  const transactions = await prisma.transaction.findMany({
    where: {
      executedAt: {
        gte: goal.startDate,
        lte: goal.endDate,
      },
      ...(goal.accountIds.length > 0 && {
        bankAccountId: { in: goal.accountIds },
      }),
      type: goal.trackIncome ? 'INCOME' : 'EXPENSE',
    },
  })
  
  const current = transactions.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  )
  
  const target = Number(goal.targetAmount)
  
  // Calculate pace
  const now = new Date()
  const totalDays = Math.ceil(
    (goal.endDate.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const elapsedDays = Math.max(1, Math.ceil(
    (now.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ))
  
  const expectedPercent = (elapsedDays / totalDays) * 100
  const actualPercent = (current / target) * 100
  const paceDiff = actualPercent - expectedPercent
  
  let status: 'ahead' | 'ontrack' | 'behind' | 'atrisk'
  if (paceDiff > 5) status = 'ahead'
  else if (paceDiff > -5) status = 'ontrack'
  else if (paceDiff > -15) status = 'behind'
  else status = 'atrisk'
  
  // Forecast
  const dailyRate = current / elapsedDays
  const daysToComplete = dailyRate > 0 
    ? Math.ceil((target - current) / dailyRate) 
    : Infinity
  const forecastDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
  
  return {
    goal,
    current,
    target,
    pace: {
      status,
      percentDiff: Math.round(paceDiff),
      forecastDate: forecastDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      }),
    },
  }
}

async function getDayStats(goal: { accountIds: string[], trackIncome: boolean }) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = startOfDay(subDays(now, 1))
  
  const baseWhere = {
    ...(goal.accountIds.length > 0 && {
      bankAccountId: { in: goal.accountIds },
    }),
    type: goal.trackIncome ? 'INCOME' as const : 'EXPENSE' as const,
  }
  
  const [todayTx, yesterdayTx] = await Promise.all([
    prisma.transaction.findMany({
      where: { ...baseWhere, executedAt: { gte: todayStart } },
    }),
    prisma.transaction.findMany({
      where: { ...baseWhere, executedAt: { gte: yesterdayStart, lt: todayStart } },
    }),
  ])
  
  return {
    today: {
      amount: todayTx.reduce((sum, tx) => sum + Number(tx.amount), 0),
      transactions: todayTx.length,
    },
    yesterday: {
      amount: yesterdayTx.reduce((sum, tx) => sum + Number(tx.amount), 0),
      transactions: yesterdayTx.length,
    },
  }
}

export default async function DashboardPage() {
  const goal = await getActiveGoal()
  
  // No goal set - show setup prompt
  if (!goal) {
    return (
      <main className="min-h-screen p-8 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Goal Dashboard</h1>
        <p className="text-gray-400 text-xl mb-8">Нет активных целей</p>
        <a 
          href="/setup" 
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg"
        >
          Создать цель
        </a>
      </main>
    )
  }
  
  const [progress, stats] = await Promise.all([
    getGoalProgress(goal.id),
    getDayStats(goal),
  ])
  
  if (!progress) {
    return <div>Error loading goal</div>
  }

  return (
    <main className="min-h-screen p-8 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-start mb-8">
        <h1 className="text-2xl text-gray-400">{goal.name}</h1>
        <LiveIndicator />
      </header>

      {/* Main progress */}
      <div className="flex-1 flex flex-col justify-center">
        <GoalProgress
          current={progress.current}
          target={progress.target}
          currency={goal.currency}
          pace={progress.pace}
        />
      </div>

      {/* Footer stats */}
      <footer className="mt-8">
        <TodayStats
          today={stats.today}
          yesterday={stats.yesterday}
          currency={goal.currency}
        />
      </footer>
    </main>
  )
}
