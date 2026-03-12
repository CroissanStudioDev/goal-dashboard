import { and, desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { bankAccounts, db, goals } from '@/db'
import { getAuthSession } from '@/lib/session'
import { AccountsList } from './AccountsList'
import { ConnectBankForm } from './ConnectBankForm'
import { GoalsList } from './GoalsList'
import { SyncButton } from './SyncButton'
import { SyncSettings } from './SyncSettings'

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
    .where(
      and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)),
    )
    .orderBy(desc(bankAccounts.createdAt))
}

async function getGoals(userId: string) {
  return db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.isActive, true)))
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
            <a href="/" className="text-text-secondary hover:text-text">
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
            <hr className="border-border" />
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
              className="inline-block px-4 py-2 bg-primary hover:bg-primary-hover rounded-lg"
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
          <CardContent className="space-y-4">
            <SyncSettings />
            <hr className="border-border" />
            <SyncButton />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
