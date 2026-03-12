'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ConnectBankForm() {
  const router = useRouter()
  const [bank, setBank] = useState<'tochka' | 'tbank'>('tochka')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const endpoint =
        bank === 'tochka' ? '/api/banks/tochka' : '/api/banks/tbank'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка подключения')
      }

      setToken('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleConnect} className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBank('tochka')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            bank === 'tochka'
              ? 'bg-primary text-white'
              : 'bg-bg-elevated text-text-muted hover:text-text'
          }`}
        >
          Точка
        </button>
        <button
          type="button"
          onClick={() => setBank('tbank')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            bank === 'tbank'
              ? 'bg-primary text-white'
              : 'bg-bg-elevated text-text-muted hover:text-text'
          }`}
        >
          Т-Банк
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="password"
          placeholder="JWT токен"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          className="flex-1 px-3 py-2 bg-bg-elevated rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Добавить'}
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  )
}
