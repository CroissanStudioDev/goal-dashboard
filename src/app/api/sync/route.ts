import { NextRequest, NextResponse } from 'next/server'
import { db, bankAccounts, transactions, syncLogs } from '@/db'
import { eq, and, gte } from 'drizzle-orm'
import { TochkaClient } from '@/lib/banks/tochka'
import { TBankClient } from '@/lib/banks/tbank'
import { subDays, subMinutes } from 'date-fns'

// POST /api/sync - Sync transactions from banks
// Called from client-side polling when dashboard is open
export async function POST(request: NextRequest) {
  const accounts = await db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.isActive, true))
  
  if (accounts.length === 0) {
    return NextResponse.json({ 
      message: 'No accounts connected',
      synced: 0 
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
        continue
      }
      
      // Fetch last 7 days of transactions
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
        // Check if exists
        const [existing] = await db
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.bankAccountId, account.id),
            eq(transactions.externalId, tx.id)
          ))
          .limit(1)
        
        if (!existing) {
          await db.insert(transactions).values({
            bankAccountId: account.id,
            externalId: tx.id,
            amount: tx.amount.toString(),
            currency: tx.currency,
            type: tx.type === 'income' ? 'INCOME' : 'EXPENSE',
            counterparty: tx.counterparty,
            description: tx.description,
            executedAt: tx.executedAt,
          })
          added++
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
