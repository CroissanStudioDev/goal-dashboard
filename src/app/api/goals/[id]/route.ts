import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/session'
import { getGoalWithProgress } from '@/lib/goals'
import { db, goals } from '@/db'
import { eq, and } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/goals/[id] - Get goal with progress
export async function GET(request: NextRequest, { params }: RouteParams) {
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

// DELETE /api/goals/[id] - Deactivate goal
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    
    // Only update if the goal belongs to this user
    const result = await db
      .update(goals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(goals.id, id),
        eq(goals.userId, userId)
      ))
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
