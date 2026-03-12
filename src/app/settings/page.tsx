import { and, desc, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'
import { bankAccounts, db, goals } from '@/db'
import { getAuthSession } from '@/lib/session'
import { AccountsList } from './AccountsList'
import { ConnectBankForm } from './ConnectBankForm'
import { ExclusionsList } from './ExclusionsList'
import { GoalsList } from './GoalsList'
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
      <div className="max-w-2xl mx-auto space-y-12">
        <header className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Настройки</h1>
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

        {/* Bank Accounts */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
            Счета
          </h2>
          <AccountsList accounts={accountsList} />
          <ConnectBankForm />
        </section>

        {/* Goals */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
            Цели
          </h2>
          <GoalsList goals={goalsList} />
          <a
            href="/setup"
            className="inline-flex px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-medium transition-colors"
          >
            Новая цель
          </a>
        </section>

        {/* Exclusions */}
        {goalsList.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
              Исключения
            </h2>
            <ExclusionsList goal={goalsList[0]} />
          </section>
        )}

        {/* Sync */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">
            Синхронизация
          </h2>
          <SyncSettings />
        </section>
      </div>
    </main>
  )
}
