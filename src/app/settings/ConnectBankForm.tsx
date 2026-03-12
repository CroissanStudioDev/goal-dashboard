'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Input } from '@/components/ui'

export function ConnectBankForm() {
  const router = useRouter()
  const [bank, setBank] = useState<'tochka' | 'tbank'>('tochka')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

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
        throw new Error(data.error || 'Failed to connect')
      }

      setSuccess(`Подключено ${data.accounts.length} счёт(ов)`)
      setToken('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const bankInfo = {
    tochka: {
      label: 'Точка',
      description:
        'Введите JWT-токен из раздела "Интеграции и API" в личном кабинете.',
      placeholder: 'Вставьте JWT-токен...',
    },
    tbank: {
      label: 'Т-Банк',
      description: 'Введите API-токен из личного кабинета Т-Бизнес.',
      placeholder: 'Вставьте API-токен...',
    },
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Подключить банк</h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBank('tochka')}
          className={`px-4 py-2 rounded-lg ${
            bank === 'tochka' ? 'bg-primary' : 'bg-bg-muted'
          }`}
        >
          Точка
        </button>
        <button
          type="button"
          onClick={() => setBank('tbank')}
          className={`px-4 py-2 rounded-lg ${
            bank === 'tbank' ? 'bg-primary' : 'bg-bg-muted'
          }`}
        >
          Т-Банк
        </button>
      </div>

      <form onSubmit={handleConnect} className="space-y-3">
        <p className="text-sm text-text-secondary">{bankInfo[bank].description}</p>
        <Input
          label="Токен"
          type="password"
          placeholder={bankInfo[bank].placeholder}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Подключение...' : `Подключить ${bankInfo[bank].label}`}
        </Button>
      </form>

      {error && <p className="text-danger-text text-sm">{error}</p>}
      {success && <p className="text-success-text text-sm">{success}</p>}
    </div>
  )
}
