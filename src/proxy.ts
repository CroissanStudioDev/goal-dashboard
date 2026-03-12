/**
 * Next.js Proxy for auth protection (Next.js 16+)
 */

import { getSessionCookie } from 'better-auth/cookies'
import { type NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication
const publicRoutes = ['/sign-in', '/api/auth']

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow static files (explicit extensions only to prevent auth bypass)
  const STATIC_FILE_PATTERN =
    /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff2?|ttf|eot)$/
  if (pathname.startsWith('/_next') || STATIC_FILE_PATTERN.test(pathname)) {
    return NextResponse.next()
  }

  // Check for session cookie
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    // Redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
