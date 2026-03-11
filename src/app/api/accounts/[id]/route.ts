import { NextRequest, NextResponse } from 'next/server'
import { db, bankAccounts } from '@/db'
import { eq } from 'drizzle-orm'

// GET /api/accounts/[id] - Get account details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const [account] = await db
    .select({
      id: bankAccounts.id,
      bank: bankAccounts.bank,
      accountId: bankAccounts.accountId,
      accountName: bankAccounts.accountName,
      currency: bankAccounts.currency,
      lastSyncAt: bankAccounts.lastSyncAt,
      isActive: bankAccounts.isActive,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.id, params.id))
    .limit(1)
  
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }
  
  return NextResponse.json(account)
}

// DELETE /api/accounts/[id] - Disconnect account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await db
    .update(bankAccounts)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(bankAccounts.id, params.id))
  
  return new NextResponse(null, { status: 204 })
}
