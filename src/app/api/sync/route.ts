import { NextRequest, NextResponse } from 'next/server'
import { db, bankAccounts, transactions } from '@/db'
import { eq, and } from 'drizzle-orm'
import { TochkaClient } from '@/lib/banks/tochka'
import { TBankClient } from '@/lib/banks/tbank'
import { safeDecryptToken, encryptToken } from '@/lib/crypto'
import { checkRateLimit, getClientId } from '@/lib/rate-limit'
import { requireUserId } from '@/lib/session'
import { subDays, subMinutes } from 'date-fns'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const SYNC_COOLDOWN_MINUTES = 5

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

// POST /api/sync - Sync transactions from banks for current user
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId()
    
    // Rate limiting
    const clientId = getClientId(request)
    const rateLimit = checkRateLimit(`sync:${userId}:${clientId}`, RATE_LIMIT)
    
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
    
    // Get user's active accounts
    const accounts = await db
      .select()
      .from(bankAccounts)
      .where(and(
        eq(bankAccounts.userId, userId),
        eq(bankAccounts.isActive, true)
      ))
    
    if (accounts.length === 0) {
      return NextResponse.json({ 
        message: 'No accounts to sync',
        syncedAt: new Date().toISOString(),
        totalAdded: 0,
        results: [],
      })
    }
    
    const results = []
    let totalAdded = 0
    const now = new Date()
    const cooldownTime = subMinutes(now, SYNC_COOLDOWN_MINUTES)
    
    for (const account of accounts) {
      // Skip if synced recently
      if (account.lastSyncAt && account.lastSyncAt > cooldownTime) {
        results.push({
          accountId: account.id,
          bank: account.bank,
          status: 'skipped',
          reason: 'synced_recently',
        })
        continue
      }
      
      try {
        // Decrypt tokens
        const accessToken = safeDecryptToken(account.accessToken)
        const refreshToken = safeDecryptToken(account.refreshToken)
        
        if (!accessToken) {
          results.push({
            accountId: account.id,
            bank: account.bank,
            status: 'error',
            error: 'No access token',
          })
          continue
        }
        
        // Create bank client
        let client
        if (account.bank === 'TOCHKA') {
          client = new TochkaClient({
            clientId: process.env.TOCHKA_CLIENT_ID!,
            clientSecret: process.env.TOCHKA_CLIENT_SECRET!,
            accessToken,
            refreshToken: refreshToken || undefined,
          })
        } else {
          client = new TBankClient({
            token: accessToken,
          })
        }
        
        // Fetch transactions (last 90 days)
        const fromDate = subDays(now, 90)
        const bankTransactions = await withRetry(() => 
          client.getTransactions(account.accountId, fromDate, now)
        )
        
        // Batch insert with conflict handling
        if (bankTransactions.length > 0) {
          const toInsert = bankTransactions.map(t => ({
            userId,
            bankAccountId: account.id,
            externalId: t.id,
            amount: String(Math.abs(t.amount)),
            currency: t.currency,
            type: t.amount >= 0 ? 'INCOME' as const : 'EXPENSE' as const,
            counterparty: t.counterparty || null,
            description: t.description || null,
            executedAt: t.date,
          }))
          
          const inserted = await db
            .insert(transactions)
            .values(toInsert)
            .onConflictDoNothing({
              target: [transactions.bankAccountId, transactions.externalId],
            })
            .returning({ id: transactions.id })
          
          totalAdded += inserted.length
          
          results.push({
            accountId: account.id,
            bank: account.bank,
            status: 'success',
            fetched: bankTransactions.length,
            added: inserted.length,
          })
        } else {
          results.push({
            accountId: account.id,
            bank: account.bank,
            status: 'success',
            fetched: 0,
            added: 0,
          })
        }
        
        // Update last sync time and potentially refresh token
        const updateData: Record<string, unknown> = {
          lastSyncAt: now,
          updatedAt: now,
        }
        
        // Check if we got a new token (for Tochka refresh)
        if (account.bank === 'TOCHKA' && client instanceof TochkaClient) {
          const newToken = client.getAccessToken()
          if (newToken && newToken !== accessToken) {
            updateData.accessToken = encryptToken(newToken)
          }
        }
        
        await db
          .update(bankAccounts)
          .set(updateData)
          .where(eq(bankAccounts.id, account.id))
        
      } catch (error) {
        results.push({
          accountId: account.id,
          bank: account.bank,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
    
    return NextResponse.json({
      syncedAt: now.toISOString(),
      totalAdded,
      results,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
