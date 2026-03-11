import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  currency: z.string().default('RUB'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  accountIds: z.array(z.string()).optional(),
  trackIncome: z.boolean().default(true),
  trackExpense: z.boolean().default(false),
})

// GET /api/goals - List all goals
export async function GET() {
  const goals = await prisma.goal.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  
  return NextResponse.json(goals)
}

// POST /api/goals - Create new goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createGoalSchema.parse(body)
    
    const goal = await prisma.goal.create({
      data: {
        name: data.name,
        targetAmount: data.targetAmount,
        currency: data.currency,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        accountIds: data.accountIds || [],
        trackIncome: data.trackIncome,
        trackExpense: data.trackExpense,
      },
    })
    
    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    throw error
  }
}
