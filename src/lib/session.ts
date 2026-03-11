/**
 * Session utilities for API routes and server components
 */

import { headers } from 'next/headers'
import { auth } from './auth'

export interface AuthSession {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    createdAt: Date
    updatedAt: Date
  }
  session: {
    id: string
    expiresAt: Date
    token: string
    createdAt: Date
    updatedAt: Date
    ipAddress?: string | null
    userAgent?: string | null
    userId: string
  }
}

/**
 * Get the current session in server components or API routes
 * Returns null if not authenticated
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  
  return session
}

/**
 * Require authentication - throws if not authenticated
 * Use in API routes to protect endpoints
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getAuthSession()
  
  if (!session) {
    throw new AuthError('Unauthorized', 401)
  }
  
  return session
}

/**
 * Get user ID from session or throw
 */
export async function requireUserId(): Promise<string> {
  const session = await requireAuth()
  return session.user.id
}

/**
 * Custom auth error for proper HTTP responses
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}
