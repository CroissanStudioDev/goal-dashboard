import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-6xl font-light text-text-subtle mb-4">404</div>
      <p className="text-text-muted mb-6">Страница не найдена</p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full text-sm font-medium transition-colors"
      >
        На главную
      </Link>
    </main>
  )
}
