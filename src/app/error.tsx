'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">😵</div>
      <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
      <p className="text-text-secondary mb-6 text-center max-w-md">
        {error.message || 'Произошла непредвиденная ошибка'}
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Попробовать снова</Button>
        <Button
          variant="secondary"
          onClick={() => (window.location.href = '/')}
        >
          На главную
        </Button>
      </div>
      {error.digest && (
        <p className="text-text-subtle text-sm mt-4">Error ID: {error.digest}</p>
      )}
    </main>
  )
}
