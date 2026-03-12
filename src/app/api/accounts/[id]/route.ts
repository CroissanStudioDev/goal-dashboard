import { and, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { bankAccounts, db } from '@/db'
import { requireUserId } from '@/lib/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/accounts/[id] - Get account details
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    const [account] = await db
      .select({
        id: bankAccounts.id,
        bank: bankAccounts.bank,
        accountId: bankAccounts.accountId,
        accountName: bankAccounts.accountName,
        currency: bankAccounts.currency,
        isActive: bankAccounts.isActive,
        lastSyncAt: bankAccounts.lastSyncAt,
        createdAt: bankAccounts.createdAt,
      })
      .from(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}

// DELETE /api/accounts/[id] - Deactivate account
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireUserId()
    const { id } = await params

    const result = await db
      .update(bankAccounts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
      .returning({ id: bankAccounts.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}
