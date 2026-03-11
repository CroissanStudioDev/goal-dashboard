/**
 * Better Auth configuration
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  
  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    // Require email verification (optional)
    requireEmailVerification: false,
  },
  
  // Session configuration
  session: {
    // Session expires in 7 days
    expiresIn: 60 * 60 * 24 * 7,
    // Update session expiry on each request
    updateAge: 60 * 60 * 24, // 1 day
    // Cookie configuration
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  
  // Plugins
  plugins: [
    nextCookies(), // Handle cookies in server actions
  ],
  
  // Trusted origins for CORS
  trustedOrigins: process.env.NEXT_PUBLIC_APP_URL 
    ? [process.env.NEXT_PUBLIC_APP_URL] 
    : [],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
