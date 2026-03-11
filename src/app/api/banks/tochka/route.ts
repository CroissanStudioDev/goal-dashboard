import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { TochkaClient } from '@/lib/banks/tochka'
import { isTochkaConfigured } from '@/lib/env'
import { randomUUID } from 'crypto'

// GET /api/banks/tochka - Start OAuth flow
export async function GET(request: NextRequest) {
  if (!isTochkaConfigured()) {
    return NextResponse.json(
      { error: 'Tochka Bank not configured' },
      { status: 400 }
    )
  }
  
  const client = new TochkaClient({
    clientId: process.env.TOCHKA_CLIENT_ID!,
    clientSecret: process.env.TOCHKA_CLIENT_SECRET!,
  })
  
  try {
    // Step 1: Create consent (valid for 1 year)
    const expirationDate = new Date()
    expirationDate.setFullYear(expirationDate.getFullYear() + 1)
    
    const consentId = await client.createConsent(expirationDate)
    
    // Step 2: Generate state for CSRF protection
    const state = randomUUID()
    
    // Store state and consentId in cookies (HttpOnly, secure)
    const cookieStore = cookies()
    cookieStore.set('tochka_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })
    cookieStore.set('tochka_consent', consentId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
    })
    
    // Step 3: Redirect to authorization
    const authUrl = client.getAuthUrl(
      process.env.TOCHKA_REDIRECT_URI!,
      consentId,
      state
    )
    
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Tochka auth init error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const redirectUrl = new URL('/settings', request.url)
    redirectUrl.searchParams.set('error', `tochka_init_failed: ${errorMessage}`)
    
    return NextResponse.redirect(redirectUrl)
  }
}
