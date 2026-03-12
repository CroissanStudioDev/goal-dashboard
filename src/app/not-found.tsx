import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="text-8xl font-light text-text-subtle mb-6">404</div>
      <h1 className="text-xl font-medium mb-2">Page not found</h1>
      <p className="text-text-muted mb-8">This page doesn't exist</p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-full font-medium transition-colors"
      >
        Go Home
      </Link>
    </main>
  )
}
