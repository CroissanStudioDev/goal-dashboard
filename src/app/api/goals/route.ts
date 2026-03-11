import { NextRequest, NextResponse } from 'next/server'
import { db, goals } from '@/db'
import { desc, eq } from 'drizzle-orm'
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
  const result = await db
    .select()
    .from(goals)
    .where(eq(goals.isActive, true))
    .orderBy(desc(goals.createdAt))
  
  return NextResponse.json(result)
}

// POST /api/goals - Create new goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createGoalSchema.parse(body)
    
    const [goal] = await db
      .insert(goals)
      .values({
        name: data.name,
        targetAmount: data.targetAmount.toString(),
        currency: data.currency,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        accountIds: data.accountIds || [],
        trackIncome: data.trackIncome,
        trackExpense: data.trackExpense,
      })
      .returning()
    
    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    throw error
  }
}
