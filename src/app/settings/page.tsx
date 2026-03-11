import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/session'
import { db, bankAccounts, goals } from '@/db'
import { eq, and, desc } from 'drizzle-orm'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { ConnectBankForm } from './ConnectBankForm'
import { AccountsList } from './AccountsList'
import { GoalsList } from './GoalsList'
import { SyncButton } from './SyncButton'
import { UserMenu } from '@/components/UserMenu'

export const dynamic = 'force-dynamic'

async function getAccounts(userId: string) {
  return db
    .select({
      id: bankAccounts.id,
      bank: bankAccounts.bank,
      accountId: bankAccounts.accountId,
      accountName: bankAccounts.accountName,
      currency: bankAccounts.currency,
      lastSyncAt: bankAccounts.lastSyncAt,
      createdAt: bankAccounts.createdAt,
    })
    .from(bankAccounts)
    .where(and(
      eq(bankAccounts.userId, userId),
      eq(bankAccounts.isActive, true)
    ))
    .orderBy(desc(bankAccounts.createdAt))
}

async function getGoals(userId: string) {
  return db
    .select()
    .from(goals)
    .where(and(
      eq(goals.userId, userId),
      eq(goals.isActive, true)
    ))
    .orderBy(desc(goals.createdAt))
}

export default async function SettingsPage() {
  const session = await getAuthSession()
  
  if (!session) {
    redirect('/sign-in?callbackUrl=/settings')
  }
  
  const userId = session.user.id
  
  const [accountsList, goalsList] = await Promise.all([
    getAccounts(userId),
    getGoals(userId),
  ])
  
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">⚙️ Настройки</h1>
          <div className="flex items-center gap-4">
            <a href="/" className="text-gray-400 hover:text-white">
              ← На дашборд
            </a>
            <UserMenu />
          </div>
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
              Транзакции синхронизируются автоматически каждые 10 минут пока открыт дашборд.
              Вы можете запустить синхронизацию вручную.
            </p>
            <SyncButton />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
