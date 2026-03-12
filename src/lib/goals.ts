/**
 * Goal progress calculation logic
 * Single source of truth for all goal-related calculations
 */

import { startOfDay, subDays } from 'date-fns'
import { and, desc, eq, gte, inArray, lt, lte } from 'drizzle-orm'
import { db, goals, transactions } from '@/db'

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
 * Get the currently active goal for a user
 */
export async function getActiveGoal(userId: string) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.isActive, true)))
    .orderBy(desc(goals.createdAt))
    .limit(1)

  return goal ?? null
}

/**
 * Get goal by ID (only if it belongs to the user)
 */
export async function getGoalById(id: string, userId: string) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .limit(1)

  return goal ?? null
}

/**
 * Calculate progress toward a goal
 */
export async function calculateGoalProgress(
  goal: typeof goals.$inferSelect,
  userId: string,
): Promise<GoalProgress> {
  const conditions = [
    eq(transactions.userId, userId),
    gte(transactions.executedAt, goal.startDate),
    lte(transactions.executedAt, goal.endDate),
  ]

  // Filter by specific accounts if set
  if (goal.accountIds.length > 0) {
    conditions.push(inArray(transactions.bankAccountId, goal.accountIds))
  }

  // Filter by transaction type
  const types: ('INCOME' | 'EXPENSE')[] = []
  if (goal.trackIncome) types.push('INCOME')
  if (goal.trackExpense) types.push('EXPENSE')

  if (types.length === 1) {
    conditions.push(eq(transactions.type, types[0]))
  } else if (types.length === 2) {
    conditions.push(inArray(transactions.type, types))
  }

  const txs = await db
    .select({
      amount: transactions.amount,
      type: transactions.type,
      counterparty: transactions.counterparty,
    })
    .from(transactions)
    .where(and(...conditions))

  let current = 0
  for (const tx of txs) {
    // Skip excluded counterparties (partial match, case-insensitive)
    if (goal.excludeCounterparties.length > 0 && tx.counterparty) {
      const cp = tx.counterparty.toLowerCase()
      if (goal.excludeCounterparties.some(ex => cp.includes(ex.toLowerCase()))) {
        continue
      }
    }

    const amount = parseFloat(tx.amount)
    if (tx.type === 'INCOME') {
      current += amount
    } else if (tx.type === 'EXPENSE') {
      current -= amount
    }
  }

  const target = parseFloat(goal.targetAmount)
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0

  return {
    current,
    target,
    percent,
    transactionCount: txs.length,
  }
}

/**
 * Calculate pace toward goal
 */
export function calculatePace(
  goal: typeof goals.$inferSelect,
  progress: GoalProgress,
): PaceInfo {
  const now = new Date()
  const start = new Date(goal.startDate)
  const end = new Date(goal.endDate)

  const totalDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const daysElapsed = Math.max(
    1,
    Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const _daysRemaining = Math.max(
    0,
    Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  )

  const expectedPercent = (daysElapsed / totalDays) * 100
  const percentDiff = progress.percent - expectedPercent

  const dailyRate = progress.current / daysElapsed
  const daysToComplete =
    dailyRate > 0
      ? Math.ceil((progress.target - progress.current) / dailyRate)
      : Infinity

  const forecastDate = new Date(
    now.getTime() + daysToComplete * 24 * 60 * 60 * 1000,
  )

  let status: PaceStatus
  if (percentDiff >= 10) {
    status = 'ahead'
  } else if (percentDiff >= -5) {
    status = 'ontrack'
  } else if (percentDiff >= -20) {
    status = 'behind'
  } else {
    status = 'atrisk'
  }

  return {
    status,
    percentDiff,
    forecastDate: Number.isFinite(daysToComplete)
      ? forecastDate.toISOString()
      : 'never',
    dailyRate,
  }
}

/**
 * Get daily stats for a goal
 */
export async function getDayStats(
  goal: typeof goals.$inferSelect,
  userId: string,
): Promise<{ today: DayStats; yesterday: DayStats }> {
  const todayStart = startOfDay(new Date())
  const yesterdayStart = startOfDay(subDays(new Date(), 1))

  const baseConditions = [eq(transactions.userId, userId)]

  if (goal.accountIds.length > 0) {
    baseConditions.push(inArray(transactions.bankAccountId, goal.accountIds))
  }

  const types: ('INCOME' | 'EXPENSE')[] = []
  if (goal.trackIncome) types.push('INCOME')
  if (goal.trackExpense) types.push('EXPENSE')

  if (types.length === 1) {
    baseConditions.push(eq(transactions.type, types[0]))
  } else if (types.length === 2) {
    baseConditions.push(inArray(transactions.type, types))
  }

  // Today's transactions
  const todayTxs = await db
    .select({ amount: transactions.amount, type: transactions.type })
    .from(transactions)
    .where(and(...baseConditions, gte(transactions.executedAt, todayStart)))

  // Yesterday's transactions
  const yesterdayTxs = await db
    .select({ amount: transactions.amount, type: transactions.type })
    .from(transactions)
    .where(
      and(
        ...baseConditions,
        gte(transactions.executedAt, yesterdayStart),
        lt(transactions.executedAt, todayStart),
      ),
    )

  const sumTransactions = (txs: { amount: string; type: string }[]) => {
    return txs.reduce((sum, tx) => {
      const amount = parseFloat(tx.amount)
      return tx.type === 'INCOME' ? sum + amount : sum - amount
    }, 0)
  }

  return {
    today: {
      amount: sumTransactions(todayTxs),
      transactions: todayTxs.length,
    },
    yesterday: {
      amount: sumTransactions(yesterdayTxs),
      transactions: yesterdayTxs.length,
    },
  }
}

/**
 * Get full goal data with progress (for API)
 */
export async function getGoalWithProgress(
  goalId: string,
  userId: string,
): Promise<GoalWithProgress | null> {
  const goal = await getGoalById(goalId, userId)
  if (!goal) return null

  const progress = await calculateGoalProgress(goal, userId)
  const pace = calculatePace(goal, progress)
  const { today, yesterday } = await getDayStats(goal, userId)

  return {
    goal,
    progress,
    pace,
    today,
    yesterday,
  }
}
