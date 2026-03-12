import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { bankAccounts, db, transactions } from '@/db'
import { requireUserId } from '@/lib/session'

const addTransactionSchema = z.object({
  bankAccountId: z.string(),
  amount: z.number(),
  type: z.enum(['INCOME', 'EXPENSE']),
  counterparty: z.string().optional(),
  description: z.string().optional(),
  executedAt: z.string().transform((s) => new Date(s)),
})

// GET /api/transactions - List user's transactions
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '100', 10),
      500,
    )
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type') as 'INCOME' | 'EXPENSE' | null

    let query = db
      .select({
        id: transactions.id,
        bankAccountId: transactions.bankAccountId,
        externalId: transactions.externalId,
        amount: transactions.amount,
        currency: transactions.currency,
        type: transactions.type,
        counterparty: transactions.counterparty,
        description: transactions.description,
        executedAt: transactions.executedAt,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.executedAt))
      .limit(limit)
      .offset(offset)
      .$dynamic()

    if (from) {
      query = query.where(gte(transactions.executedAt, new Date(from)))
    }
    if (to) {
      query = query.where(lte(transactions.executedAt, new Date(to)))
    }
    if (type) {
      query = query.where(eq(transactions.type, type))
    }

    const result = await query

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    throw error
  }
}

// POST /api/transactions - Add manual transaction
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId()
    const body = await request.json()

    const data = addTransactionSchema.parse(body)

    // Verify account belongs to user
    const [account] = await db
      .select({ id: bankAccounts.id })
      .from(bankAccounts)
      .where(
        and(
          eq(bankAccounts.id, data.bankAccountId),
          eq(bankAccounts.userId, userId),
        ),
      )
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Generate unique external ID for manual transactions
    const externalId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        bankAccountId: data.bankAccountId,
        externalId,
        amount: String(Math.abs(data.amount)),
        type: data.type,
        counterparty: data.counterparty,
        description: data.description,
        executedAt: data.executedAt,
      })
      .returning()

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 },
      )
    }
    throw error
  }
}
