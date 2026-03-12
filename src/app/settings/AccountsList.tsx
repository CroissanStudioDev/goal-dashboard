'use client'

import { useRouter } from 'next/navigation'

interface AccountDisplay {
  id: string
  bank: 'TOCHKA' | 'TBANK'
  accountId: string
  accountName: string
  currency: string
  lastSyncAt: Date | null
}

interface AccountsListProps {
  accounts: AccountDisplay[]
}

const bankLabels = {
  TOCHKA: 'Точка',
  TBANK: 'Т-Банк',
}

export function AccountsList({ accounts }: AccountsListProps) {
  const router = useRouter()

  const handleDisconnect = async (id: string) => {
    if (!confirm('Отключить этот счёт?')) return

    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (accounts.length === 0) {
    return <p className="text-text-muted">Нет подключённых счетов</p>
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center justify-between p-3 bg-bg-muted rounded-lg"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{account.accountName}</span>
              <span className="text-xs px-2 py-0.5 bg-bg-subtle rounded">
                {bankLabels[account.bank]}
              </span>
            </div>
            <div className="text-sm text-text-secondary">
              {account.accountId} • {account.currency}
            </div>
            {account.lastSyncAt && (
              <div className="text-xs text-text-muted">
                Синхр: {new Date(account.lastSyncAt).toLocaleString('ru-RU')}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDisconnect(account.id)}
            className="text-danger-text hover:text-danger text-sm"
          >
            Отключить
          </button>
        </div>
      ))}
    </div>
  )
}
