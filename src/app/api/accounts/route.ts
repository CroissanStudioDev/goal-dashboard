import { NextResponse } from 'next/server'
import { db, bankAccounts } from '@/db'
import { eq, desc } from 'drizzle-orm'

// GET /api/accounts - List all connected bank accounts
export async function GET() {
  const accounts = await db
    .select({
      id: bankAccounts.id,
      bank: bankAccounts.bank,
      accountId: bankAccounts.accountId,
      accountName: bankAccounts.accountName,
      currency: bankAccounts.currency,
      lastSyncAt: bankAccounts.lastSyncAt,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.isActive, true))
    .orderBy(desc(bankAccounts.createdAt))
  
  return NextResponse.json(accounts)
}
