import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db, bankAccounts } from '@/db'
import { TochkaClient } from '@/lib/banks/tochka'
import { encryptToken } from '@/lib/crypto'
import { requireUserId } from '@/lib/session'

// GET /api/banks/tochka/callback - OAuth callback
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()
    
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // Check for OAuth errors
    if (error) {
      const redirectUrl = new URL('/settings', request.url)
      redirectUrl.searchParams.set('error', `tochka_oauth: ${error}`)
      return NextResponse.redirect(redirectUrl)
    }
    
    if (!code) {
      const redirectUrl = new URL('/settings', request.url)
      redirectUrl.searchParams.set('error', 'tochka_oauth: no code')
      return NextResponse.redirect(redirectUrl)
    }
    
    // Verify state (CSRF protection)
    const cookieStore = await cookies()
    const savedState = cookieStore.get('tochka_state')?.value
    const savedConsent = cookieStore.get('tochka_consent')?.value
    
    if (!savedState || savedState !== state) {
      const redirectUrl = new URL('/settings', request.url)
      redirectUrl.searchParams.set('error', 'tochka_oauth: invalid state')
      return NextResponse.redirect(redirectUrl)
    }
    
    // Clear cookies
    cookieStore.delete('tochka_state')
    cookieStore.delete('tochka_consent')
    
    // Exchange code for tokens
    const client = new TochkaClient({
      clientId: process.env.TOCHKA_CLIENT_ID!,
      clientSecret: process.env.TOCHKA_CLIENT_SECRET!,
    })
    
    const tokens = await client.exchangeCode(
      code,
      process.env.TOCHKA_REDIRECT_URI!
    )
    
    // Get accounts
    client.setTokens(tokens.accessToken, tokens.refreshToken)
    const accounts = await client.getAccounts()
    
    // Save accounts with encrypted tokens
    const encryptedAccess = encryptToken(tokens.accessToken)
    const encryptedRefresh = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null
    
    for (const acc of accounts) {
      await db
        .insert(bankAccounts)
        .values({
          userId,
          bank: 'TOCHKA',
          accountId: acc.id,
          accountName: acc.name,
          currency: acc.currency,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          tokenExpiry: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [bankAccounts.userId, bankAccounts.bank, bankAccounts.accountId],
          set: {
            accessToken: encryptedAccess,
            refreshToken: encryptedRefresh,
            tokenExpiry: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
            isActive: true,
            updatedAt: new Date(),
          },
        })
    }
    
    const redirectUrl = new URL('/settings', request.url)
    redirectUrl.searchParams.set('success', `tochka_connected:${accounts.length}`)
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('Tochka callback error:', error)
    
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.redirect(new URL('/sign-in?callbackUrl=/settings', request.url))
    }
    
    const redirectUrl = new URL('/settings', request.url)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    redirectUrl.searchParams.set('error', `tochka_callback: ${errorMessage}`)
    return NextResponse.redirect(redirectUrl)
  }
}
