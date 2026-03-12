'use client'

import { useEffect } from 'react'

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
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-4xl font-light text-text-subtle mb-4">Ошибка</div>
      <p className="text-sm text-text-muted mb-6 text-center max-w-xs">
        {error.message || 'Что-то пошло не так'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-medium transition-colors"
      >
        Попробовать снова
      </button>
    </main>
  )
}
