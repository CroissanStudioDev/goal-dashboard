'use client'

import { useRouter } from 'next/navigation'
import { BankAccount } from '@/db'

interface AccountsListProps {
  accounts: BankAccount[]
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
    return (
      <p className="text-gray-500">Нет подключённых счетов</p>
    )
  }
  
  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{account.accountName}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                {bankLabels[account.bank]}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {account.accountId} • {account.currency}
            </div>
            {account.lastSyncAt && (
              <div className="text-xs text-gray-500">
                Синхр: {new Date(account.lastSyncAt).toLocaleString('ru-RU')}
              </div>
            )}
          </div>
          <button
            onClick={() => handleDisconnect(account.id)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Отключить
          </button>
        </div>
      ))}
    </div>
  )
}
