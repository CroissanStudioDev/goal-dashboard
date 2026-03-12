import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { bankAccounts, db } from '@/db'
import { TBankClient } from '@/lib/banks/tbank'
import { encryptToken } from '@/lib/crypto'
import { requireUserId } from '@/lib/session'

const connectSchema = z.object({
  token: z.string().min(1),
})

// POST /api/banks/tbank - Connect T-Bank with token
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()

    const { token } = connectSchema.parse(body)

    // Create client and verify token
    const client = new TBankClient({ token })

    // Get accounts to verify token works
    const accounts = await client.getAccounts()

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No accounts found' }, { status: 400 })
    }

    // Encrypt and save
    const encryptedToken = encryptToken(token)

    const savedAccounts = []
    for (const acc of accounts) {
      const [saved] = await db
        .insert(bankAccounts)
        .values({
          userId,
          bank: 'TBANK',
          accountId: acc.id,
          accountName: acc.name,
          currency: acc.currency,
          accessToken: encryptedToken,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [
            bankAccounts.userId,
            bankAccounts.bank,
            bankAccounts.accountId,
          ],
          set: {
            accessToken: encryptedToken,
            isActive: true,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: bankAccounts.id,
          accountName: bankAccounts.accountName,
        })

      savedAccounts.push(saved)
    }

    return NextResponse.json({
      success: true,
      accounts: savedAccounts,
    })
  } catch (error) {
    console.error('T-Bank connect error:', error)

    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
