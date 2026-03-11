import { NextRequest, NextResponse } from 'next/server'
import { TochkaClient } from '@/lib/banks/tochka'
import { randomUUID } from 'crypto'

// GET /api/auth/tochka - Start OAuth flow
export async function GET() {
  const client = new TochkaClient({
    clientId: process.env.TOCHKA_CLIENT_ID!,
    clientSecret: process.env.TOCHKA_CLIENT_SECRET!,
  })
  
  // Generate state for CSRF protection
  const state = randomUUID()
  
  // TODO: Store state in session/cookie for verification
  
  // For now, use a placeholder consent ID
  // In production, you'd first create a consent request
  const consentId = 'placeholder-consent-id'
  
  const authUrl = client.getAuthUrl(
    process.env.TOCHKA_REDIRECT_URI!,
    consentId,
    state
  )
  
  return NextResponse.redirect(authUrl)
}
