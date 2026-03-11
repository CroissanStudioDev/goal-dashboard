import { NextRequest, NextResponse } from 'next/server'
import { db, bankAccounts, transactions } from '@/db'
import { eq } from 'drizzle-orm'
import { TochkaClient } from '@/lib/banks/tochka'
import { TBankClient } from '@/lib/banks/tbank'
import { safeDecryptToken, encryptToken } from '@/lib/crypto'
import { checkRateLimit, getClientId } from '@/lib/rate-limit'
import { subDays, subMinutes } from 'date-fns'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Rate limit: 10 requests per minute per client
const RATE_LIMIT = { limit: 10, windowMs: 60_000 }

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on auth errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError
      }
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (i + 1)))
      }
    }
  }
  
  throw lastError
}

// POST /api/sync - Sync transactions from banks
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientId(request)
  const rateLimit = checkRateLimit(`sync:${clientId}`, RATE_LIMIT)
  
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    )
  }
  
  const accounts = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.isActive, true))
  
  if (accounts.length === 0) {
    return NextResponse.json({ 
      message: 'No accounts connected',
      totalAdded: 0,
      results: [],
    })
  }
  
  const results = []
  let totalAdded = 0
  
  for (const account of accounts) {
    // Skip if synced less than 5 minutes ago
    if (account.lastSyncAt && account.lastSyncAt > subMinutes(new Date(), 5)) {
      results.push({
        accountId: account.id,
        bank: account.bank,
        status: 'skipped',
        reason: 'synced recently',
      })
      continue
    }
    
    // Decrypt tokens
    const accessToken = safeDecryptToken(account.accessToken)
    const refreshToken = safeDecryptToken(account.refreshToken)
    
    if (!accessToken) {
      results.push({
        accountId: account.id,
        bank: account.bank,
        status: 'error',
        error: 'Invalid or missing access token',
      })
      continue
    }
    
    try {
      let txs: Awaited<ReturnType<typeof TochkaClient.prototype.getTransactions>>
      
      if (account.bank === 'TOCHKA') {
        const client = new TochkaClient({
          clientId: process.env.TOCHKA_CLIENT_ID!,
          clientSecret: process.env.TOCHKA_CLIENT_SECRET!,
          accessToken,
          refreshToken: refreshToken || undefined,
          // Save refreshed tokens back to DB
          onTokenRefresh: async (newAccess, newRefresh) => {
            await db
              .update(bankAccounts)
              .set({
                accessToken: encryptToken(newAccess),
                refreshToken: encryptToken(newRefresh),
                updatedAt: new Date(),
              })
              .where(eq(bankAccounts.id, account.id))
          },
        })
        
        // Fetch last 7 days of transactions with retry
        const toDate = new Date()
        const fromDate = subDays(toDate, 7)
        
        txs = await withRetry(() => 
          client.getTransactions(account.accountId, fromDate, toDate)
        )
      } else if (account.bank === 'TBANK') {
        const client = new TBankClient({
          token: accessToken,
          // mTLS certs would be configured via env vars
          certificatePath: process.env.TBANK_CERT_PATH,
          certificateKeyPath: process.env.TBANK_KEY_PATH,
          certificatePassword: process.env.TBANK_CERT_PASSWORD,
        })
        
        const toDate = new Date()
        const fromDate = subDays(toDate, 7)
        
        txs = await withRetry(() =>
          client.getTransactions(account.accountId, fromDate, toDate)
        )
      } else {
        continue
      }
      
      // Batch insert with conflict handling
      let added = 0
      
      if (txs.length > 0) {
        const values = txs.map(tx => ({
          bankAccountId: account.id,
          externalId: tx.id,
          amount: tx.amount.toString(),
          currency: tx.currency,
          type: tx.type === 'income' ? 'INCOME' as const : 'EXPENSE' as const,
          counterparty: tx.counterparty,
          description: tx.description,
          executedAt: tx.executedAt,
        }))
        
        // Insert in batches of 100
        const batchSize = 100
        for (let i = 0; i < values.length; i += batchSize) {
          const batch = values.slice(i, i + batchSize)
          
          const result = await db
            .insert(transactions)
            .values(batch)
            .onConflictDoNothing({
              target: [transactions.bankAccountId, transactions.externalId],
            })
            .returning({ id: transactions.id })
          
          added += result.length
        }
      }
      
      totalAdded += added
      
      // Update last sync time
      await db
        .update(bankAccounts)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(bankAccounts.id, account.id))
      
      results.push({
        accountId: account.id,
        bank: account.bank,
        status: 'success',
        fetched: txs.length,
        added,
      })
    } catch (error) {
      console.error(`Sync error for ${account.bank} ${account.accountId}:`, error)
      
      results.push({
        accountId: account.id,
        bank: account.bank,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  
  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    totalAdded,
    results,
  })
}

// GET /api/sync - Get sync status
export async function GET() {
  const accounts = await db
    .select({
      id: bankAccounts.id,
      bank: bankAccounts.bank,
      accountName: bankAccounts.accountName,
      lastSyncAt: bankAccounts.lastSyncAt,
    })
    .from(bankAccounts)
    .where(eq(bankAccounts.isActive, true))
  
  return NextResponse.json({
    accounts,
    canSync: accounts.some(a => 
      !a.lastSyncAt || a.lastSyncAt < subMinutes(new Date(), 5)
    ),
  })
}
