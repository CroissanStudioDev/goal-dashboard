import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { startOfDay, subDays } from 'date-fns'

// GET /api/goals/[id]/stats - Get today/yesterday stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const goal = await prisma.goal.findUnique({
    where: { id: params.id },
  })
  
  if (!goal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }
  
  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = startOfDay(subDays(now, 1))
  
  const baseWhere = {
    ...(goal.accountIds.length > 0 && {
      bankAccountId: { in: goal.accountIds },
    }),
    type: goal.trackIncome ? 'INCOME' as const : 'EXPENSE' as const,
  }
  
  // Today's transactions
  const todayTx = await prisma.transaction.findMany({
    where: {
      ...baseWhere,
      executedAt: {
        gte: todayStart,
      },
    },
  })
  
  // Yesterday's transactions
  const yesterdayTx = await prisma.transaction.findMany({
    where: {
      ...baseWhere,
      executedAt: {
        gte: yesterdayStart,
        lt: todayStart,
      },
    },
  })
  
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
