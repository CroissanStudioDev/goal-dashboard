'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    name: '',
    targetAmount: '',
    currency: 'RUB',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          targetAmount: parseFloat(form.targetAmount),
          currency: form.currency,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate + 'T23:59:59').toISOString(),
        }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.[0]?.message || 'Failed to create goal')
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
    <main className="min-h-screen p-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🎯 Создать цель</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Название"
              placeholder="Выручка за март"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Сумма цели"
                type="number"
                placeholder="2000000"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                required
                min="1"
              />
              
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-300">
                  Валюта
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white"
                >
                  <option value="RUB">₽ RUB</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Начало"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
              
              <Input
                label="Конец"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
            
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
