'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'
import { BankAccount } from '@/db'

interface AddTransactionFormProps {
  accounts: BankAccount[]
}

export function AddTransactionForm({ accounts }: AddTransactionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    accountId: accounts[0]?.id || '',
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    amount: '',
    counterparty: '',
    description: '',
    executedAt: new Date().toISOString().slice(0, 16),
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountId: form.accountId,
          type: form.type,
          amount: parseFloat(form.amount),
          counterparty: form.counterparty || undefined,
          description: form.description || undefined,
          executedAt: new Date(form.executedAt).toISOString(),
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add transaction')
      }
      
      // Reset form
      setForm({
        ...form,
        amount: '',
        counterparty: '',
        description: '',
      })
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  if (accounts.length === 0) {
    return (
      <p className="text-gray-500">
        Сначала подключите банковский счёт в <a href="/settings" className="text-blue-400 hover:underline">настройках</a>
      </p>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">Счёт</label>
          <select
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
            required
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-300">Тип</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as 'INCOME' | 'EXPENSE' })}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
          >
            <option value="INCOME">Приход</option>
            <option value="EXPENSE">Расход</option>
          </select>
        </div>
        
        <Input
          label="Сумма"
          type="number"
          placeholder="100000"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
          min="0.01"
          step="0.01"
        />
        
        <Input
          label="Дата/время"
          type="datetime-local"
          value={form.executedAt}
          onChange={(e) => setForm({ ...form, executedAt: e.target.value })}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Контрагент"
          placeholder="ООО Ромашка"
          value={form.counterparty}
          onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
        />
        
        <Input
          label="Описание"
          placeholder="Оплата по договору"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>
      
      {error && <p className="text-red-400 text-sm">{error}</p>}
      
      <Button type="submit" disabled={loading}>
        {loading ? 'Добавление...' : 'Добавить'}
      </Button>
    </form>
  )
}
