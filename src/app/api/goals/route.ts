import { and, desc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db, goals } from '@/db'
import { requireUserId } from '@/lib/session'

const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currency: z.string().default('RUB'),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  accountIds: z.array(z.string()).default([]),
  trackIncome: z.boolean().default(true),
  trackExpense: z.boolean().default(false),
})

// GET /api/goals - List user's goals
export async function GET() {
  try {
    const userId = await requireUserId()

    const result = await db
      .select()
      .from(goals)
      .where(and(eq(goals.userId, userId), eq(goals.isActive, true)))
      .orderBy(desc(goals.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()

    const data = createGoalSchema.parse(body)

    // Deactivate other goals for this user
    await db
      .update(goals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(goals.userId, userId), eq(goals.isActive, true)))

    // Create new goal
    const [goal] = await db
      .insert(goals)
      .values({
        userId,
        name: data.name,
        targetAmount: String(data.targetAmount),
        currency: data.currency,
        startDate: data.startDate,
        endDate: data.endDate,
        accountIds: data.accountIds,
        trackIncome: data.trackIncome,
        trackExpense: data.trackExpense,
        isActive: true,
      })
      .returning()

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 },
      )
    }
    throw error
  }
}
