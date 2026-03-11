import { db, goals, transactions } from '@/db'
import { eq, and, gte, lte, lt, inArray, desc } from 'drizzle-orm'
import { startOfDay, subDays } from 'date-fns'
import { GoalProgress } from '@/components/GoalProgress'
import { TodayStats } from '@/components/TodayStats'
import { LiveIndicator } from '@/components/LiveIndicator'
import { AutoRefresh } from '@/components/AutoRefresh'
import { SyncStatus } from '@/components/SyncStatus'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getActiveGoal() {
  const [goal] = await db
    .select()
    .from(goals)
    .where(eq(goals.isActive, true))
    .orderBy(desc(goals.createdAt))
    .limit(1)
  
  return goal
}

async function getGoalProgress(goal: typeof goals.$inferSelect) {
  const conditions = [
    gte(transactions.executedAt, goal.startDate),
    lte(transactions.executedAt, goal.endDate),
    eq(transactions.type, goal.trackIncome ? 'INCOME' : 'EXPENSE'),
  ]
  
  if (goal.accountIds.length > 0) {
    conditions.push(inArray(transactions.bankAccountId, goal.accountIds))
  }
  
  const txs = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
  
  const current = txs.reduce((sum, tx) => sum + Number(tx.amount), 0)
  const target = Number(goal.targetAmount)
  
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
  
  const dailyRate = current / elapsedDays
  const daysToComplete = dailyRate > 0 
    ? Math.ceil((target - current) / dailyRate) 
    : Infinity
  const forecastDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
  
  return {
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

async function getDayStats(goal: typeof goals.$inferSelect) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = startOfDay(subDays(now, 1))
  
  const baseConditions = [
    eq(transactions.type, goal.trackIncome ? 'INCOME' : 'EXPENSE'),
  ]
  
  if (goal.accountIds.length > 0) {
    baseConditions.push(inArray(transactions.bankAccountId, goal.accountIds))
  }
  
  const [todayTx, yesterdayTx] = await Promise.all([
    db.select().from(transactions).where(and(
      ...baseConditions,
      gte(transactions.executedAt, todayStart)
    )),
    db.select().from(transactions).where(and(
      ...baseConditions,
      gte(transactions.executedAt, yesterdayStart),
      lt(transactions.executedAt, todayStart)
    )),
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
  
  const [progress, stats] = await Promise.all([
    getGoalProgress(goal),
    getDayStats(goal),
  ])

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
