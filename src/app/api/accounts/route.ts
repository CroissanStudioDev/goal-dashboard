import { and, desc, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { bankAccounts, db } from '@/db'
import { requireUserId } from '@/lib/session'

// GET /api/accounts - List user's bank accounts
export async function GET() {
  try {
    const userId = await requireUserId()

    const accounts = await db
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
      .where(
        and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)),
      )
      .orderBy(desc(bankAccounts.createdAt))

    return NextResponse.json(accounts)
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}
