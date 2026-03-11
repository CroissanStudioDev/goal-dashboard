import { db, bankAccounts, goals } from '@/db'
import { eq, desc } from 'drizzle-orm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { ConnectBankForm } from './ConnectBankForm'
import { AccountsList } from './AccountsList'
import { GoalsList } from './GoalsList'

export const dynamic = 'force-dynamic'

async function getAccounts() {
  return db
    .select()
    .from(bankAccounts)
    .where(eq(bankAccounts.isActive, true))
    .orderBy(desc(bankAccounts.createdAt))
}

async function getGoals() {
  return db
    .select()
    .from(goals)
    .where(eq(goals.isActive, true))
    .orderBy(desc(goals.createdAt))
}

export default async function SettingsPage() {
  const [accountsList, goalsList] = await Promise.all([
    getAccounts(),
    getGoals(),
  ])
  
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">⚙️ Настройки</h1>
          <a href="/" className="text-gray-400 hover:text-white">
            ← На дашборд
          </a>
        </header>
        
        {/* Bank Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>🏦 Банковские счета</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AccountsList accounts={accountsList} />
            <hr className="border-gray-800" />
            <ConnectBankForm />
          </CardContent>
        </Card>
        
        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Цели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoalsList goals={goalsList} />
            <a 
              href="/setup" 
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              + Новая цель
            </a>
          </CardContent>
        </Card>
        
        {/* Sync */}
        <Card>
          <CardHeader>
            <CardTitle>🔄 Синхронизация</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Транзакции синхронизируются автоматически каждые 15 минут.
              Вы можете запустить синхронизацию вручную.
            </p>
            <SyncButton />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function SyncButton() {
  return (
    <form action="/api/sync" method="POST">
      <button
        type="submit"
        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
      >
        Синхронизировать сейчас
      </button>
    </form>
  )
}
