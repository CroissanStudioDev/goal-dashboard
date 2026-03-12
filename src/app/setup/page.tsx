'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currency: 'RUB',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    trackIncome: true,
    trackExpense: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          targetAmount: parseFloat(form.targetAmount),
          currency: form.currency,
          startDate: form.startDate,
          endDate: form.endDate,
          trackIncome: form.trackIncome,
          trackExpense: form.trackExpense,
          accountIds: [],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create goal')
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 md:p-12 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>New Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Name"
              placeholder="March Revenue"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target"
                type="number"
                placeholder="1000000"
                value={form.targetAmount}
                onChange={(e) =>
                  setForm({ ...form, targetAmount: e.target.value })
                }
                required
                min="0"
                step="0.01"
              />

              <div>
                <label
                  htmlFor="currency-select"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  Currency
                </label>
                <select
                  id="currency-select"
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-bg-muted rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                >
                  <option value="RUB">RUB</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />

              <Input
                label="End Date"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="block text-sm font-medium text-text-secondary">
                Track
              </legend>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.trackIncome}
                    onChange={(e) =>
                      setForm({ ...form, trackIncome: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-0 bg-bg-muted text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm">Income</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.trackExpense}
                    onChange={(e) =>
                      setForm({ ...form, trackExpense: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-0 bg-bg-muted text-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <span className="text-sm">Expenses</span>
                </label>
              </div>
            </fieldset>

            {error && <p className="text-danger text-sm">{error}</p>}

            <div className="flex gap-4 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Goal'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
