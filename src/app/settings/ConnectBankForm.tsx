'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input } from '@/components/ui'

export function ConnectBankForm() {
  const router = useRouter()
  const [bank, setBank] = useState<'tochka' | 'tbank'>('tochka')
  const [tbankToken, setTbankToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const handleTochkaConnect = () => {
    window.location.href = '/api/auth/tochka'
  }
  
  const handleTBankConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const res = await fetch('/api/auth/tbank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tbankToken }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect')
      }
      
      setSuccess(`Подключено ${data.accounts.length} счёт(ов)`)
      setTbankToken('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Подключить банк</h3>
      
      <div className="flex gap-2">
        <button
          onClick={() => setBank('tochka')}
          className={`px-4 py-2 rounded-lg ${
            bank === 'tochka' ? 'bg-blue-600' : 'bg-gray-800'
          }`}
        >
          Точка
        </button>
        <button
          onClick={() => setBank('tbank')}
          className={`px-4 py-2 rounded-lg ${
            bank === 'tbank' ? 'bg-blue-600' : 'bg-gray-800'
          }`}
        >
          Т-Банк
        </button>
      </div>
      
      {bank === 'tochka' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-400">
            Подключение через OAuth 2.0. Вы будете перенаправлены на сайт банка.
          </p>
          <Button onClick={handleTochkaConnect}>
            Подключить Точку
          </Button>
        </div>
      ) : (
        <form onSubmit={handleTBankConnect} className="space-y-3">
          <p className="text-sm text-gray-400">
            Введите API-токен из личного кабинета Т-Бизнес.
          </p>
          <Input
            label="API Token"
            type="password"
            placeholder="Вставьте токен..."
            value={tbankToken}
            onChange={(e) => setTbankToken(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Подключение...' : 'Подключить Т-Банк'}
          </Button>
        </form>
      )}
      
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {success && <p className="text-green-400 text-sm">{success}</p>}
    </div>
  )
}
