import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/session'
import { getDayStats } from '@/lib/goals'
import { db, goals } from '@/db'
import { eq, and } from 'drizzle-orm'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/goals/[id]/stats - Get goal daily stats
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    
    // Get goal and verify ownership
    const [goal] = await db
      .select()
      .from(goals)
      .where(and(
        eq(goals.id, id),
        eq(goals.userId, userId)
      ))
      .limit(1)
    
    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }
    
    const stats = await getDayStats(goal, userId)
    
    return NextResponse.json(stats)
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}
