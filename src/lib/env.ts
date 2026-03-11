/**
 * Environment variable validation
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Encryption (required for token storage)
  ENCRYPTION_SECRET: z.string().min(32, 'ENCRYPTION_SECRET must be at least 32 characters'),
  
  // Auth (optional - if not set, app is open)
  AUTH_USERNAME: z.string().optional(),
  AUTH_PASSWORD: z.string().optional(),
  
  // Точка Bank (optional)
  TOCHKA_CLIENT_ID: z.string().optional(),
  TOCHKA_CLIENT_SECRET: z.string().optional(),
  TOCHKA_REDIRECT_URI: z.string().url().optional(),
  
  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export type Env = z.infer<typeof envSchema>

let cachedEnv: Env | null = null

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv
  
  const result = envSchema.safeParse(process.env)
  
  if (!result.success) {
    const errors = result.error.issues
      .map(i => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    
    console.error('❌ Invalid environment variables:\n' + errors)
    
    // In development, provide helpful message
    if (process.env.NODE_ENV === 'development') {
      console.error('\nMake sure you have a .env.local file with required variables.')
      console.error('See .env.example for reference.\n')
    }
    
    throw new Error('Invalid environment configuration')
  }
  
  cachedEnv = result.data
  return cachedEnv
}

/**
 * Check if auth is enabled
 */
export function isAuthEnabled(): boolean {
  return !!(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD)
}

/**
 * Check if Tochka is configured
 */
export function isTochkaConfigured(): boolean {
  return !!(
    process.env.TOCHKA_CLIENT_ID &&
    process.env.TOCHKA_CLIENT_SECRET &&
    process.env.TOCHKA_REDIRECT_URI
  )
}
