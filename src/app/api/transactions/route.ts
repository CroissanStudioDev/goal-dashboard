import { NextRequest, NextResponse } from 'next/server'
import { db, transactions } from '@/db'
import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { createId } from '@paralleldrive/cuid2'

const createTransactionSchema = z.object({
  bankAccountId: z.string().min(1),
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z.number().positive(),
  currency: z.string().default('RUB'),
  counterparty: z.string().optional(),
  description: z.string().optional(),
  executedAt: z.string().datetime(),
})

// GET /api/transactions - List recent transactions
export async function GET() {
  const result = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.executedAt))
    .limit(100)
  
  return NextResponse.json(result)
}

// POST /api/transactions - Add manual transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTransactionSchema.parse(body)
    
    const [tx] = await db
      .insert(transactions)
      .values({
        bankAccountId: data.bankAccountId,
        externalId: `manual-${createId()}`,
        type: data.type,
        amount: data.amount.toString(),
        currency: data.currency,
        counterparty: data.counterparty,
        description: data.description,
        executedAt: new Date(data.executedAt),
      })
      .returning()
    
    return NextResponse.json(tx, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    throw error
  }
}
