import { NextRequest, NextResponse } from 'next/server'
import { db, goals, transactions } from '@/db'
import { eq, and, gte, lt, inArray } from 'drizzle-orm'
import { startOfDay, subDays } from 'date-fns'

// GET /api/goals/[id]/stats - Get today/yesterday stats
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
  
  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = startOfDay(subDays(now, 1))
  
  const baseConditions = [
    eq(transactions.type, goal.trackIncome ? 'INCOME' : 'EXPENSE'),
  ]
  
  if (goal.accountIds.length > 0) {
    baseConditions.push(inArray(transactions.bankAccountId, goal.accountIds))
  }
  
  // Today's transactions
  const todayTx = await db
    .select()
    .from(transactions)
    .where(and(...baseConditions, gte(transactions.executedAt, todayStart)))
  
  // Yesterday's transactions
  const yesterdayTx = await db
    .select()
    .from(transactions)
    .where(and(
      ...baseConditions,
      gte(transactions.executedAt, yesterdayStart),
      lt(transactions.executedAt, todayStart)
    ))
  
  return NextResponse.json({
    today: {
      amount: todayTx.reduce((sum, tx) => sum + Number(tx.amount), 0),
      transactions: todayTx.length,
    },
    yesterday: {
      amount: yesterdayTx.reduce((sum, tx) => sum + Number(tx.amount), 0),
      transactions: yesterdayTx.length,
    },
  })
}
