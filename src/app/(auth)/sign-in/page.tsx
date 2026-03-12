'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@/components/ui'
import { signIn } from '@/lib/auth-client'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await signIn.email({
        email: form.email,
        password: form.password,
      })

      if (result.error) {
        setError(result.error.message || 'Ошибка входа')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8 flex items-center justify-center bg-bg">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🔐 Вход</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />

            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="current-password"
            />

            {error && <p className="text-danger-text text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-8 flex items-center justify-center bg-bg">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center text-text-muted">
              Загрузка...
            </CardContent>
          </Card>
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  )
}
