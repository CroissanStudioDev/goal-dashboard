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
    if (!confirm('Отключить счёт?')) return

    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (accounts.length === 0) {
    return <p className="text-sm text-text-muted">Нет подключённых счетов</p>
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center justify-between p-4 bg-bg-elevated rounded-xl"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{account.accountName}</span>
              <span className="text-xs px-2 py-0.5 bg-bg-muted rounded-full text-text-muted">
                {bankLabels[account.bank]}
              </span>
            </div>
            <div className="text-xs text-text-muted mt-1">
              {account.currency}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDisconnect(account.id)}
            className="text-xs text-danger hover:opacity-70 transition-opacity"
          >
            Удалить
          </button>
        </div>
      ))}
    </div>
  )
}
