import { db, goals, transactions } from '@/db'
import { eq, and, gte, lte, lt, inArray, desc } from 'drizzle-orm'
import { startOfDay, subDays } from 'date-fns'
import { TVDashboard } from './TVDashboard'

export const dynamic = 'force-dynamic'
export const revalidate = 30

async function getActiveGoal() {
  const [goal] = await db
    .select()
    .from(goals)
    .where(eq(goals.isActive, true))
    .orderBy(desc(goals.createdAt))
    .limit(1)
  
  return goal
}

async function getGoalData(goal: typeof goals.$inferSelect) {
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
  
  // Pace calculation
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
  
  // Today/yesterday stats
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
    goal: {
      name: goal.name,
      currency: goal.currency,
      endDate: goal.endDate.toISOString(),
    },
    progress: {
      current,
      target,
      percent: actualPercent,
    },
    pace: {
      status,
      percentDiff: Math.round(paceDiff),
      forecastDate: forecastDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
      }),
    },
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

export default async function TVPage() {
  const goal = await getActiveGoal()
  
  if (!goal) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <h1 className="text-4xl text-gray-600">Нет активных целей</h1>
      </main>
    )
  }
  
  const data = await getGoalData(goal)
  
  return <TVDashboard data={data} />
}
