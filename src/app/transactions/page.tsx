import { and, desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { bankAccounts, db, transactions } from '@/db'
import { getAuthSession } from '@/lib/session'
import { AddTransactionForm } from './AddTransactionForm'

export const dynamic = 'force-dynamic'

async function getTransactions(userId: string, limit = 50) {
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

async function getAccounts(userId: string) {
  return db
    .select({
      id: bankAccounts.id,
      accountName: bankAccounts.accountName,
      bank: bankAccounts.bank,
    })
    .from(bankAccounts)
    .where(
      and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)),
    )
}

function formatCurrency(amount: string | number, currency: string) {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num)
}

export default async function TransactionsPage() {
  const session = await getAuthSession()

  if (!session) {
    redirect('/sign-in?callbackUrl=/transactions')
  }

  const userId = session.user.id

  const [txList, accountsList] = await Promise.all([
    getTransactions(userId),
    getAccounts(userId),
  ])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">💰 Транзакции</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-text-secondary hover:text-text">
              ← На дашборд
            </a>
            <UserMenu />
          </div>
        </header>

        {/* Add Transaction */}
        {accountsList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>➕ Добавить транзакцию</CardTitle>
            </CardHeader>
            <CardContent>
              <AddTransactionForm accounts={accountsList} />
            </CardContent>
          </Card>
        )}

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <CardTitle>📋 История ({txList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {txList.length === 0 ? (
              <p className="text-text-muted">Нет транзакций</p>
            ) : (
              <div className="space-y-2">
                {txList.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-3 bg-bg-elevated rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        {tx.counterparty || tx.description || 'Без описания'}
                      </div>
                      <div className="text-sm text-text-muted">
                        {new Date(tx.executedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div
                      className={`font-mono font-medium ${
                        tx.type === 'INCOME' ? 'text-success-text' : 'text-danger-text'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
