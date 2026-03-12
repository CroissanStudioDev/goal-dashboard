import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { bankAccounts, db } from '@/db'
import { TochkaClient } from '@/lib/banks/tochka'
import { encryptToken } from '@/lib/crypto'
import { requireUserId } from '@/lib/session'

// POST /api/banks/tochka - Connect with JWT token
export async function POST(request: Request) {
  try {
    const userId = await requireUserId()
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Test token by fetching accounts
    const client = new TochkaClient({ token })

    let accounts: Awaited<ReturnType<typeof client.getAccounts>>
    try {
      accounts = await client.getAccounts()
    } catch (error) {
      console.error('Tochka API error:', error)
      return NextResponse.json(
        { error: 'Invalid token or API error' },
        { status: 400 },
      )
    }

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No accounts found' }, { status: 400 })
    }

    // Encrypt token
    const encryptedToken = encryptToken(token)

    // Save accounts to database
    const savedAccounts = []

    for (const acc of accounts) {
      // Check if account already exists
      const existing = await db
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.accountId, acc.id))
        .limit(1)

      if (existing.length > 0) {
        // Update token
        await db
          .update(bankAccounts)
          .set({
            accessToken: encryptedToken,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(bankAccounts.id, existing[0].id))

        savedAccounts.push(existing[0])
      } else {
        // Create new
        const [newAccount] = await db
          .insert(bankAccounts)
          .values({
            userId,
            bank: 'TOCHKA',
            accountId: acc.id,
            accountName: acc.name,
            currency: acc.currency,
            accessToken: encryptedToken,
            isActive: true,
          })
          .returning()

        savedAccounts.push(newAccount)
      }
    }

    return NextResponse.json({
      success: true,
      accounts: savedAccounts.map((a) => ({
        id: a.id,
        accountId: a.accountId,
        accountName: a.accountName,
        currency: a.currency,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Tochka connect error:', error)
    return NextResponse.json(
      { error: 'Failed to connect Tochka' },
      { status: 500 },
    )
  }
}
