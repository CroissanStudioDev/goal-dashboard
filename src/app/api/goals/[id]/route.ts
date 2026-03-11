import { NextRequest, NextResponse } from 'next/server'
import { db, goals, transactions } from '@/db'
import { eq, and, gte, lte, inArray } from 'drizzle-orm'

// GET /api/goals/[id] - Get goal with progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [goal] = await db
    .select()
    .from(goals)
    .where(eq(goals.id, params.id))
    .limit(1)
  
  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }
  
  // Build where conditions
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
  
  const current = txs.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0
  )
  
  const target = Number(goal.targetAmount)
  const percent = (current / target) * 100
  
  // Calculate pace
  const now = new Date()
  const totalDays = Math.ceil(
    (goal.endDate.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const elapsedDays = Math.ceil(
    (now.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const expectedPercent = (elapsedDays / totalDays) * 100
  const paceDiff = percent - expectedPercent
  
  let status: 'ahead' | 'ontrack' | 'behind' | 'atrisk'
  if (paceDiff > 5) status = 'ahead'
  else if (paceDiff > -5) status = 'ontrack'
  else if (paceDiff > -15) status = 'behind'
  else status = 'atrisk'
  
  // Forecast completion date
  const dailyRate = current / Math.max(elapsedDays, 1)
  const daysToComplete = dailyRate > 0 ? Math.ceil((target - current) / dailyRate) : Infinity
  const forecastDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
  
  return NextResponse.json({
    goal,
    progress: {
      current,
      target,
      percent,
      transactionCount: txs.length,
    },
    pace: {
      status,
      percentDiff: Math.round(paceDiff),
      forecastDate: forecastDate.toISOString(),
      dailyRate,
    },
  })
}

// DELETE /api/goals/[id] - Deactivate goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db
    .update(goals)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(goals.id, params.id))
  
  return new NextResponse(null, { status: 204 })
}
