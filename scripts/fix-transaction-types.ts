/**
 * Migration script to fix transaction types
 *
 * Problem: All transactions were saved as INCOME due to a bug
 * Solution: Delete all transactions and re-sync from banks
 *
 * Usage:
 *   DATABASE_URL=... pnpm tsx scripts/fix-transaction-types.ts
 *   or just: pnpm tsx scripts/fix-transaction-types.ts (reads from .env)
 */

import fs from 'node:fs'
import path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import { transactions } from '../src/db/schema'

// Load .env file manually
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex)
          const value = trimmed.slice(eqIndex + 1).replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      }
    }
  }
}

loadEnv()

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL not set')
  process.exit(1)
}

async function main() {
  console.log('Fixing transaction types...\n')

  const client = postgres(DATABASE_URL)
  const db = drizzle(client)

  try {
    // Count current transactions
    const [{ count: before }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)

    console.log(`Found ${before} transactions in database`)

    if (Number(before) === 0) {
      console.log('No transactions to fix. Done!')
      return
    }

    // Delete all transactions
    console.log('\nDeleting all transactions...')
    await db.delete(transactions)

    console.log(`Deleted ${before} transactions`)
    console.log('\nDone! Now re-sync from the dashboard:')
    console.log('   1. Open http://localhost:3000/settings')
    console.log('   2. Click "Синхронизировать"')
    console.log('   3. Transactions will be re-imported with correct types')
  } finally {
    await client.end()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error.message || error)
    process.exit(1)
  })
