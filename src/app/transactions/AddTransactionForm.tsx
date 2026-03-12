'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'

interface AccountOption {
  id: string
  accountName: string
  bank: 'TOCHKA' | 'TBANK'
}

interface AddTransactionFormProps {
  accounts: AccountOption[]
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
      <p className="text-text-muted text-sm">
        First connect a bank account in{' '}
        <a href="/settings" className="text-primary hover:underline">
          settings
        </a>
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label
            htmlFor="account-select"
            className="block text-sm font-medium text-text-secondary"
          >
            Account
          </label>
          <select
            id="account-select"
            value={form.accountId}
            onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-bg-muted text-text focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            required
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.accountName}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="type-select"
            className="block text-sm font-medium text-text-secondary"
          >
            Type
          </label>
          <select
            id="type-select"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as 'INCOME' | 'EXPENSE' })
            }
            className="w-full px-4 py-3 rounded-xl bg-bg-muted text-text focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>

        <Input
          label="Amount"
          type="number"
          placeholder="100000"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
          min="0.01"
          step="0.01"
        />

        <Input
          label="Date/Time"
          type="datetime-local"
          value={form.executedAt}
          onChange={(e) => setForm({ ...form, executedAt: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Counterparty"
          placeholder="Company Name"
          value={form.counterparty}
          onChange={(e) => setForm({ ...form, counterparty: e.target.value })}
        />

        <Input
          label="Description"
          placeholder="Payment details"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Transaction'}
      </Button>
    </form>
  )
}
