import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TochkaClient } from '@/lib/banks/tochka'

// GET /api/auth/tochka/callback - OAuth callback
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, request.url)
    )
  }
  
  if (!code) {
    return NextResponse.redirect(
      new URL('/?error=missing_code', request.url)
    )
  }
  
  // TODO: Verify state matches stored value
  
  const client = new TochkaClient({
    clientId: process.env.TOCHKA_CLIENT_ID!,
    clientSecret: process.env.TOCHKA_CLIENT_SECRET!,
  })
  
  try {
    // Exchange code for tokens
    const tokens = await client.exchangeCode(
      code,
      process.env.TOCHKA_REDIRECT_URI!
    )
    
    // Get accounts
    const accounts = await client.getAccounts()
    
    // Save accounts to database
    for (const account of accounts) {
      await prisma.bankAccount.upsert({
        where: {
          bank_accountId: {
            bank: 'TOCHKA',
            accountId: account.id,
          },
        },
        update: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          isActive: true,
        },
        create: {
          bank: 'TOCHKA',
          accountId: account.id,
          accountName: account.name,
          currency: account.currency,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
        },
      })
    }
    
    return NextResponse.redirect(
      new URL('/?success=tochka_connected', request.url)
    )
  } catch (err) {
    console.error('Tochka OAuth error:', err)
    return NextResponse.redirect(
      new URL('/?error=oauth_failed', request.url)
    )
  }
}
