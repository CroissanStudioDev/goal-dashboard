import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TBankClient } from '@/lib/banks/tbank'
import { z } from 'zod'

const connectSchema = z.object({
  token: z.string().min(1),
})

// POST /api/auth/tbank - Connect T-Bank with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = connectSchema.parse(body)
    
    const client = new TBankClient({ token })
    
    // Verify token by fetching accounts
    const accounts = await client.getAccounts()
    
    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No accounts found' },
        { status: 400 }
      )
    }
    
    // Save accounts to database
    const savedAccounts = []
    
    for (const account of accounts) {
      const saved = await prisma.bankAccount.upsert({
        where: {
          bank_accountId: {
            bank: 'TBANK',
            accountId: account.id,
          },
        },
        update: {
          accessToken: token,
          isActive: true,
        },
        create: {
          bank: 'TBANK',
          accountId: account.id,
          accountName: account.name,
          currency: account.currency,
          accessToken: token,
        },
      })
      
      savedAccounts.push({
        id: saved.id,
        accountId: saved.accountId,
        accountName: saved.accountName,
      })
    }
    
    return NextResponse.json({
      message: 'T-Bank connected successfully',
      accounts: savedAccounts,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    console.error('T-Bank connect error:', error)
    return NextResponse.json(
      { error: 'Failed to connect T-Bank' },
      { status: 500 }
    )
  }
}
