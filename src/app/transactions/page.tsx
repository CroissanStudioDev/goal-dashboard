import { db, transactions, bankAccounts } from '@/db'
import { desc, eq } from 'drizzle-orm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { formatCurrency } from '@/lib/format'
import Link from 'next/link'
import { AddTransactionForm } from './AddTransactionForm'

export const dynamic = 'force-dynamic'

async function getTransactions() {
  return db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      currency: transactions.currency,
      type: transactions.type,
      counterparty: transactions.counterparty,
      description: transactions.description,
      executedAt: transactions.executedAt,
      accountName: bankAccounts.accountName,
      bank: bankAccounts.bank,
    })
    .from(transactions)
    .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
    .orderBy(desc(transactions.executedAt))
    .limit(100)
}

async function getAccounts() {
  return db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.isActive, true))
}

export default async function TransactionsPage() {
  const [txList, accountsList] = await Promise.all([
    getTransactions(),
    getAccounts(),
  ])
  
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">💰 Транзакции</h1>
          <Link href="/" className="text-gray-400 hover:text-white">
            ← На дашборд
          </Link>
        </header>
        
        {/* Add manual transaction */}
        <Card>
          <CardHeader>
            <CardTitle>Добавить вручную</CardTitle>
          </CardHeader>
          <CardContent>
            <AddTransactionForm accounts={accountsList} />
          </CardContent>
        </Card>
        
        {/* Transaction list */}
        <Card>
          <CardHeader>
            <CardTitle>Последние транзакции</CardTitle>
          </CardHeader>
          <CardContent>
            {txList.length === 0 ? (
              <p className="text-gray-500">Нет транзакций</p>
            ) : (
              <div className="space-y-2">
                {txList.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}>
                          {tx.type === 'INCOME' ? '↓' : '↑'}
                        </span>
                        <span className="font-medium">
                          {tx.counterparty || tx.description || 'Без описания'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {tx.accountName && `${tx.accountName} • `}
                        {new Date(tx.executedAt).toLocaleString('ru-RU')}
                      </div>
                    </div>
                    <div className={`text-lg font-mono ${tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(Math.abs(Number(tx.amount)), tx.currency)}
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
