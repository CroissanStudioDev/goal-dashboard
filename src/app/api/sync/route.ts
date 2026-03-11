import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
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
  
  const accounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
  })
  
  const results = []
  
  for (const account of accounts) {
    const log = await prisma.syncLog.create({
      data: {
        bankAccountId: account.id,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })
    
    try {
      let client
      
      if (account.bank === 'TOCHKA') {
        client = new TochkaClient({
          clientId: process.env.TOCHKA_CLIENT_ID!,
          clientSecret: process.env.TOCHKA_CLIENT_SECRET!,
          accessToken: account.accessToken || undefined,
          refreshToken: account.refreshToken || undefined,
        })
        
        // Refresh token if needed
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
      
      const transactions = await client.getTransactions(
        account.accountId,
        fromDate,
        toDate
      )
      
      // Upsert transactions
      let added = 0
      for (const tx of transactions) {
        const result = await prisma.transaction.upsert({
          where: {
            bankAccountId_externalId: {
              bankAccountId: account.id,
              externalId: tx.id,
            },
          },
          update: {},
          create: {
            bankAccountId: account.id,
            externalId: tx.id,
            amount: tx.amount,
            currency: tx.currency,
            type: tx.type === 'income' ? 'INCOME' : 'EXPENSE',
            counterparty: tx.counterparty,
            description: tx.description,
            executedAt: tx.executedAt,
          },
        })
        
        // Count as added if it was created (not updated)
        if (result.createdAt.getTime() === result.createdAt.getTime()) {
          added++
        }
      }
      
      // Update sync status
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status: 'SUCCESS',
          transactionsAdded: added,
          completedAt: new Date(),
        },
      })
      
      await prisma.bankAccount.update({
        where: { id: account.id },
        data: { lastSyncAt: new Date() },
      })
      
      results.push({
        accountId: account.id,
        bank: account.bank,
        status: 'success',
        transactionsAdded: added,
      })
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      })
      
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
