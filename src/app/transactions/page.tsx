import { desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'
import { db, transactions } from '@/db'
import { getAuthSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

async function getTransactions(userId: string, limit = 30) {
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      currency: transactions.currency,
      type: transactions.type,
      counterparty: transactions.counterparty,
      description: transactions.description,
      executedAt: transactions.executedAt,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.executedAt))
    .limit(limit)
}

function formatCurrency(amount: string | number, currency: string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

export default async function TransactionsPage() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/sign-in?callbackUrl=/transactions')
  }

  const txList = await getTransactions(session.user.id)

  return (
    <main className="min-h-screen p-8 md:p-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Транзакции</h1>
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Назад
            </a>
            <UserMenu />
          </div>
        </header>

        {txList.length === 0 ? (
          <p className="text-sm text-text-muted">Нет транзакций</p>
        ) : (
          <div className="space-y-2">
            {txList.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-bg-elevated rounded-xl"
              >
                <div>
                  <div className="text-sm font-medium">
                    {tx.counterparty || tx.description || 'Без описания'}
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {new Date(tx.executedAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </div>
                <div
                  className={`text-sm font-medium tabular-nums ${
                    tx.type === 'INCOME' ? 'text-success' : 'text-danger'
                  }`}
                >
                  {tx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(tx.amount, tx.currency)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
