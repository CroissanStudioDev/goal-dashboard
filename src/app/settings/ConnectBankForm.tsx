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

      setSuccess(`Connected ${data.accounts.length} account(s)`)
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
      label: 'Tochka',
      description:
        'Enter the JWT token from the "Integrations & API" section in your dashboard.',
      placeholder: 'Paste JWT token...',
    },
    tbank: {
      label: 'T-Bank',
      description: 'Enter the API token from your T-Business dashboard.',
      placeholder: 'Paste API token...',
    },
  }

  return (
    <div className="space-y-5">
      <h3 className="text-base font-medium">Connect Bank</h3>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setBank('tochka')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            bank === 'tochka'
              ? 'bg-primary text-white'
              : 'bg-bg-muted text-text-secondary hover:text-text'
          }`}
        >
          Tochka
        </button>
        <button
          type="button"
          onClick={() => setBank('tbank')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            bank === 'tbank'
              ? 'bg-primary text-white'
              : 'bg-bg-muted text-text-secondary hover:text-text'
          }`}
        >
          T-Bank
        </button>
      </div>

      <form onSubmit={handleConnect} className="space-y-4">
        <p className="text-sm text-text-muted">{bankInfo[bank].description}</p>
        <Input
          label="Token"
          type="password"
          placeholder={bankInfo[bank].placeholder}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Connecting...' : `Connect ${bankInfo[bank].label}`}
        </Button>
      </form>

      {error && <p className="text-danger text-sm">{error}</p>}
      {success && <p className="text-success text-sm">{success}</p>}
    </div>
  )
}
