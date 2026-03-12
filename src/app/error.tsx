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
      <div className="text-8xl font-light text-text-subtle mb-6">!</div>
      <h1 className="text-xl font-medium mb-2">Something went wrong</h1>
      <p className="text-text-muted mb-8 text-center max-w-md">
        {error.message || 'An unexpected error occurred'}
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button
          variant="secondary"
          onClick={() => (window.location.href = '/')}
        >
          Go Home
        </Button>
      </div>
      {error.digest && (
        <p className="text-text-subtle text-xs mt-6">
          Error ID: {error.digest}
        </p>
      )}
    </main>
  )
}
