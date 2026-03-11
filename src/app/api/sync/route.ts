import { NextRequest, NextResponse } from 'next/server'
import { db, bankAccounts, transactions, syncLogs } from '@/db'
import { eq } from 'drizzle-orm'
import { TochkaClient } from '@/lib/banks/tochka'
import { TBankClient } from '@/lib/banks/tbank'
import { subDays } from 'date-fns'

// POST /api/sync - Trigger sync for all accounts
export async function POST(request: NextRequest) {
  // Optional: verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const accounts = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.isActive, true))
  
  const results = []
  
  for (const account of accounts) {
    const [log] = await db
      .insert(syncLogs)
      .values({
        bankAccountId: account.id,
        status: 'RUNNING',
        startedAt: new Date(),
      })
      .returning()
    
    try {
      let client
      
      if (account.bank === 'TOCHKA') {
        client = new TochkaClient({
          clientId: process.env.TOCHKA_CLIENT_ID!,
          clientSecret: process.env.TOCHKA_CLIENT_SECRET!,
          accessToken: account.accessToken || undefined,
          refreshToken: account.refreshToken || undefined,
        })
        
        if (account.refreshToken) {
          await client.refreshTokenIfNeeded()
        }
      } else if (account.bank === 'TBANK') {
        client = new TBankClient({
          token: account.accessToken!,
        })
      } else {
        throw new Error(`Unknown bank: ${account.bank}`)
      }
      
      // Fetch transactions for last 7 days
      const toDate = new Date()
      const fromDate = subDays(toDate, 7)
      
      const txs = await client.getTransactions(
        account.accountId,
        fromDate,
        toDate
      )
      
      // Upsert transactions
      let added = 0
      for (const tx of txs) {
        try {
          await db
            .insert(transactions)
            .values({
              bankAccountId: account.id,
              externalId: tx.id,
              amount: tx.amount.toString(),
              currency: tx.currency,
              type: tx.type === 'income' ? 'INCOME' : 'EXPENSE',
              counterparty: tx.counterparty,
              description: tx.description,
              executedAt: tx.executedAt,
            })
            .onConflictDoNothing()
          
          added++
        } catch {
          // Ignore duplicates
        }
      }
      
      // Update sync status
      await db
        .update(syncLogs)
        .set({
          status: 'SUCCESS',
          transactionsAdded: added.toString(),
          completedAt: new Date(),
        })
        .where(eq(syncLogs.id, log.id))
      
      await db
        .update(bankAccounts)
        .set({ lastSyncAt: new Date(), updatedAt: new Date() })
        .where(eq(bankAccounts.id, account.id))
      
      results.push({
        accountId: account.id,
        bank: account.bank,
        status: 'success',
        transactionsAdded: added,
      })
    } catch (error) {
      await db
        .update(syncLogs)
        .set({
          status: 'FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        })
        .where(eq(syncLogs.id, log.id))
      
      results.push({
        accountId: account.id,
        bank: account.bank,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  
  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    results,
  })
}
