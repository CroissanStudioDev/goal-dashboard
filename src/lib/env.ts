/**
 * Environment variable validation
 */

import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Better Auth
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url().optional(),

  // Encryption (required for bank token storage)
  ENCRYPTION_SECRET: z
    .string()
    .min(32, 'ENCRYPTION_SECRET must be at least 32 characters'),

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
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n')

    console.error(`❌ Invalid environment variables:\n${errors}`)

    if (process.env.NODE_ENV === 'development') {
      console.error(
        '\nMake sure you have a .env.local file with required variables.',
      )
      console.error('See .env.example for reference.\n')
    }

    throw new Error('Invalid environment configuration')
  }

  cachedEnv = result.data
  return cachedEnv
}
