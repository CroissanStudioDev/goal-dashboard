'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth-client'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'

export default function SignInPage() {
  const router = useRouter()
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
            
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
          
          <p className="text-center text-gray-500 text-sm mt-4">
            Нет аккаунта?{' '}
            <Link href="/sign-up" className="text-blue-400 hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
