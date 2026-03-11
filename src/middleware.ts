/**
 * Next.js Middleware for Basic Auth
 */

import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if auth is enabled
  const username = process.env.AUTH_USERNAME
  const password = process.env.AUTH_PASSWORD
  
  if (!username || !password) {
    return NextResponse.next()
  }
  
  // Check authorization header
  const authHeader = request.headers.get('authorization')
  
  if (authHeader?.startsWith('Basic ')) {
    const base64 = authHeader.slice(6)
    const decoded = Buffer.from(base64, 'base64').toString('utf8')
    const [user, pass] = decoded.split(':')
    
    if (user === username && pass === password) {
      return NextResponse.next()
    }
  }
  
  // Return 401 with Basic Auth challenge
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Goal Dashboard"',
    },
  })
}

export const config = {
  // Protect all routes except static files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
