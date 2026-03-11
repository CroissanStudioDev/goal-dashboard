import { NextRequest, NextResponse } from 'next/server'
import { db, goals } from '@/db'
import { eq } from 'drizzle-orm'
import { getGoalWithProgress } from '@/lib/goals'

// GET /api/goals/[id] - Get goal with progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await getGoalWithProgress(params.id)
  
  if (!data) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

// DELETE /api/goals/[id] - Deactivate goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db
    .update(goals)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(goals.id, params.id))
  
  return new NextResponse(null, { status: 204 })
}
