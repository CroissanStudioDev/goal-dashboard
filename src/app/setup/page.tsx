'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
          trackIncome: true,
          trackExpense: false,
          accountIds: [],
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка создания')
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Новая цель</h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            Отмена
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Название цели"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-3 bg-bg-elevated rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />

          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Сумма"
              value={form.targetAmount}
              onChange={(e) =>
                setForm({ ...form, targetAmount: e.target.value })
              }
              required
              min="0"
              step="0.01"
              className="flex-1 px-4 py-3 bg-bg-elevated rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="px-4 py-3 bg-bg-elevated rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            >
              <option value="RUB">₽</option>
              <option value="USD">$</option>
              <option value="EUR">€</option>
            </select>
          </div>

          <div className="flex gap-3">
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
              className="flex-1 px-4 py-3 bg-bg-elevated rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
              className="flex-1 px-4 py-3 bg-bg-elevated rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
          </div>

          {error && <p className="text-xs text-danger text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Создание...' : 'Создать'}
          </button>
        </form>
      </div>
    </main>
  )
}
