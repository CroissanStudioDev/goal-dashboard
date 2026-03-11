import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/goals/[id] - Get goal with progress
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
  
  // Calculate progress
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
      transactionCount: transactions.length,
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
  await prisma.goal.update({
    where: { id: params.id },
    data: { isActive: false },
  })
  
  return new NextResponse(null, { status: 204 })
}
