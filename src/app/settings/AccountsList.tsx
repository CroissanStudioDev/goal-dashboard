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
  TOCHKA: 'Tochka',
  TBANK: 'T-Bank',
}

export function AccountsList({ accounts }: AccountsListProps) {
  const router = useRouter()

  const handleDisconnect = async (id: string) => {
    if (!confirm('Disconnect this account?')) return

    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (accounts.length === 0) {
    return <p className="text-text-muted text-sm">No connected accounts</p>
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center justify-between p-4 bg-bg-muted rounded-xl"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{account.accountName}</span>
              <span className="text-xs px-2 py-0.5 bg-bg-subtle rounded-full text-text-muted">
                {bankLabels[account.bank]}
              </span>
            </div>
            <div className="text-sm text-text-muted mt-1">
              {account.accountId} · {account.currency}
            </div>
            {account.lastSyncAt && (
              <div className="text-xs text-text-subtle mt-1">
                Last sync:{' '}
                {new Date(account.lastSyncAt).toLocaleString('ru-RU')}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleDisconnect(account.id)}
            className="text-danger hover:opacity-70 text-sm transition-opacity"
          >
            Disconnect
          </button>
        </div>
      ))}
    </div>
  )
}
