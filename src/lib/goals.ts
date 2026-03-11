/**
 * Goal progress calculation logic
 * Single source of truth for all goal-related calculations
 */

import { db, goals, transactions } from '@/db'
import { eq, and, gte, lte, lt, inArray, desc } from 'drizzle-orm'
import { startOfDay, subDays } from 'date-fns'

export type PaceStatus = 'ahead' | 'ontrack' | 'behind' | 'atrisk'

export interface GoalProgress {
  current: number
  target: number
  percent: number
  transactionCount: number
}

export interface PaceInfo {
  status: PaceStatus
  percentDiff: number
  forecastDate: string
  dailyRate: number
}

export interface DayStats {
  amount: number
  transactions: number
}

export interface GoalWithProgress {
  goal: typeof goals.$inferSelect
  progress: GoalProgress
  pace: PaceInfo
  today: DayStats
  yesterday: DayStats
}

/**
 * Get the currently active goal
 */
export async function getActiveGoal() {
  const [goal] = await db
    .select()
    .from(goals)
    .where(eq(goals.isActive, true))
    .orderBy(desc(goals.createdAt))
    .limit(1)
  
  return goal ?? null
}

/**
 * Calculate progress for a goal
 */
export async function calculateGoalProgress(
  goal: typeof goals.$inferSelect
): Promise<GoalProgress> {
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
  
  return {
    current,
    target,
    percent: target > 0 ? (current / target) * 100 : 0,
    transactionCount: txs.length,
  }
}

/**
 * Calculate pace and forecast for a goal
 */
export function calculatePace(
  goal: typeof goals.$inferSelect,
  progress: GoalProgress
): PaceInfo {
  const now = new Date()
  
  const totalDays = Math.ceil(
    (goal.endDate.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const elapsedDays = Math.max(1, Math.ceil(
    (now.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
  ))
  
  const expectedPercent = (elapsedDays / totalDays) * 100
  const paceDiff = progress.percent - expectedPercent
  
  // Determine status
  let status: PaceStatus
  if (paceDiff > 5) status = 'ahead'
  else if (paceDiff > -5) status = 'ontrack'
  else if (paceDiff > -15) status = 'behind'
  else status = 'atrisk'
  
  // Calculate forecast
  const dailyRate = progress.current / elapsedDays
  const remaining = progress.target - progress.current
  const daysToComplete = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : Infinity
  
  const forecastDate = daysToComplete === Infinity
    ? 'никогда'
    : new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
        .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  
  return {
    status,
    percentDiff: Math.round(paceDiff),
    forecastDate,
    dailyRate,
  }
}

/**
 * Get today and yesterday stats for a goal
 */
export async function getDayStats(
  goal: typeof goals.$inferSelect
): Promise<{ today: DayStats; yesterday: DayStats }> {
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

/**
 * Get full goal data with all calculations
 */
export async function getGoalWithProgress(
  goalId?: string
): Promise<GoalWithProgress | null> {
  const goal = goalId
    ? await db.select().from(goals).where(eq(goals.id, goalId)).then(r => r[0])
    : await getActiveGoal()
  
  if (!goal) return null
  
  const [progress, dayStats] = await Promise.all([
    calculateGoalProgress(goal),
    getDayStats(goal),
  ])
  
  const pace = calculatePace(goal, progress)
  
  return {
    goal,
    progress,
    pace,
    ...dayStats,
  }
}
