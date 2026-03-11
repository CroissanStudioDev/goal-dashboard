import { NextRequest, NextResponse } from 'next/server'
import { db, bankAccounts } from '@/db'
import { eq, and } from 'drizzle-orm'
import { TochkaClient } from '@/lib/banks/tochka'

// GET /api/auth/tochka/callback - OAuth callback
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
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
      // Check if exists
      const [existing] = await db
        .select()
        .from(bankAccounts)
        .where(and(
          eq(bankAccounts.bank, 'TOCHKA'),
          eq(bankAccounts.accountId, account.id)
        ))
        .limit(1)
      
      if (existing) {
        await db
          .update(bankAccounts)
          .set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(bankAccounts.id, existing.id))
      } else {
        await db
          .insert(bankAccounts)
          .values({
            bank: 'TOCHKA',
            accountId: account.id,
            accountName: account.name,
            currency: account.currency,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          })
      }
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
