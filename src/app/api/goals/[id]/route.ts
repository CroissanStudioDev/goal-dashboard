import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { db, goals } from '@/db'
import { getGoalWithProgress } from '@/lib/goals'
import { requireUserId } from '@/lib/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/goals/[id] - Get goal with progress
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    const data = await getGoalWithProgress(id, userId)

    if (!data) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}

// PATCH /api/goals/[id] - Update goal settings
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const body = await request.json()

    const updates: Record<string, unknown> = { updatedAt: new Date() }

    if (Array.isArray(body.excludeCounterparties)) {
      updates.excludeCounterparties = body.excludeCounterparties
    }

    const result = await db
      .update(goals)
      .set(updates)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning({ id: goals.id, excludeCounterparties: goals.excludeCounterparties })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}

// DELETE /api/goals/[id] - Deactivate goal
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    // Only update if the goal belongs to this user
    const result = await db
      .update(goals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning({ id: goals.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}
