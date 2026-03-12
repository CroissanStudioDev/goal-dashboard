import { desc, eq } from 'drizzle-orm'
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
    .where(eq(bankAccounts.userId, userId))
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
    <main className="min-h-screen p-8 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Back to Dashboard
            </a>
            <UserMenu />
          </div>
        </header>

        {/* Add Transaction */}
        {accountsList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <AddTransactionForm accounts={accountsList} />
            </CardContent>
          </Card>
        )}

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <CardTitle>History ({txList.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {txList.length === 0 ? (
              <p className="text-text-muted text-sm">No transactions</p>
            ) : (
              <div className="space-y-2">
                {txList.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-4 bg-bg-muted rounded-xl"
                  >
                    <div>
                      <div className="font-medium">
                        {tx.counterparty || tx.description || 'No description'}
                      </div>
                      <div className="text-sm text-text-muted mt-0.5">
                        {new Date(tx.executedAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div
                      className={`font-medium tabular-nums ${
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
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
