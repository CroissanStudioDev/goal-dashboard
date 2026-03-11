import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db, bankAccounts } from '@/db'
import { eq, and } from 'drizzle-orm'
import { TochkaClient } from '@/lib/banks/tochka'
import { encryptToken } from '@/lib/crypto'

// GET /api/banks/tochka/callback - OAuth callback
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  const baseUrl = new URL('/settings', request.url)
  
  // Handle OAuth errors
  if (error) {
    baseUrl.searchParams.set('error', errorDescription || error)
    return NextResponse.redirect(baseUrl)
  }
  
  if (!code) {
    baseUrl.searchParams.set('error', 'missing_code')
    return NextResponse.redirect(baseUrl)
  }
  
  // Verify state (CSRF protection)
  const cookieStore = cookies()
  const savedState = cookieStore.get('tochka_state')?.value
  
  if (!savedState || savedState !== state) {
    baseUrl.searchParams.set('error', 'invalid_state')
    return NextResponse.redirect(baseUrl)
  }
  
  // Clear cookies
  cookieStore.delete('tochka_state')
  cookieStore.delete('tochka_consent')
  
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
    
    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokens.accessToken)
    const encryptedRefreshToken = encryptToken(tokens.refreshToken)
    
    // Get accounts
    const accounts = await client.getAccounts()
    
    if (accounts.length === 0) {
      baseUrl.searchParams.set('error', 'no_accounts_found')
      return NextResponse.redirect(baseUrl)
    }
    
    // Save accounts to database
    let savedCount = 0
    
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
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
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
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          })
      }
      
      savedCount++
    }
    
    baseUrl.searchParams.set('success', `tochka_connected_${savedCount}`)
    return NextResponse.redirect(baseUrl)
  } catch (err) {
    console.error('Tochka OAuth error:', err)
    
    const errorMessage = err instanceof Error ? err.message : 'oauth_failed'
    baseUrl.searchParams.set('error', errorMessage)
    return NextResponse.redirect(baseUrl)
  }
}
