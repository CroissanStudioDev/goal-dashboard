import { NextRequest, NextResponse } from 'next/server'
import { db, goals } from '@/db'
import { eq } from 'drizzle-orm'
import { getDayStats } from '@/lib/goals'

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
  
  const stats = await getDayStats(goal)
  
  return NextResponse.json(stats)
}
