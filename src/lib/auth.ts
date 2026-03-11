/**
 * Simple Basic Auth middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAuthEnabled } from './env'

/**
 * Check Basic Auth credentials
 */
export function checkAuth(request: NextRequest): boolean {
  if (!isAuthEnabled()) {
    return true // Auth not configured, allow all
  }
  
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader?.startsWith('Basic ')) {
    return false
  }
  
  const base64 = authHeader.slice(6)
  const decoded = Buffer.from(base64, 'base64').toString('utf8')
  const [username, password] = decoded.split(':')
  
  return (
    username === process.env.AUTH_USERNAME &&
    password === process.env.AUTH_PASSWORD
  )
}

/**
 * Return 401 response with Basic Auth challenge
 */
export function unauthorizedResponse(): NextResponse {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Goal Dashboard"',
    },
  })
}

/**
 * Middleware helper for protected routes
 */
export function withAuth(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest) => {
    if (!checkAuth(request)) {
      return unauthorizedResponse()
    }
    return handler(request)
  }
}
