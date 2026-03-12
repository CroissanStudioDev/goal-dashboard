'use client'

import Link from 'next/link'
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
import { signUp } from '@/lib/auth-client'

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают')
      setLoading(false)
      return
    }

    if (form.password.length < 8) {
      setError('Пароль должен быть минимум 8 символов')
      setLoading(false)
      return
    }

    try {
      const result = await signUp.email({
        name: form.name,
        email: form.email,
        password: form.password,
      })

      if (result.error) {
        setError(result.error.message || 'Ошибка регистрации')
        return
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
    <main className="min-h-screen p-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>📝 Регистрация</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Имя"
              type="text"
              placeholder="Иван Иванов"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="name"
            />

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
              placeholder="Минимум 8 символов"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              autoComplete="new-password"
              minLength={8}
            />

            <Input
              label="Подтвердите пароль"
              type="password"
              placeholder="Повторите пароль"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
              autoComplete="new-password"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-4">
            Уже есть аккаунт?{' '}
            <Link href="/sign-in" className="text-blue-400 hover:underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
