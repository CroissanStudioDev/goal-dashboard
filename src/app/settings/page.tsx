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
    <main className="min-h-screen p-8 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Settings</h1>
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

        {/* Bank Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AccountsList accounts={accountsList} />
            <div className="h-px bg-border" />
            <ConnectBankForm />
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <GoalsList goals={goalsList} />
            <a
              href="/setup"
              className="inline-flex px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-medium transition-colors"
            >
              New Goal
            </a>
          </CardContent>
        </Card>

        {/* Sync */}
        <Card>
          <CardHeader>
            <CardTitle>Synchronization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SyncSettings />
            <div className="h-px bg-border" />
            <SyncButton />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
