import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <div className="text-6xl mb-4">🤷</div>
      <h1 className="text-2xl font-bold mb-2">Страница не найдена</h1>
      <p className="text-text-secondary mb-6">Такой страницы не существует</p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg"
      >
        На главную
      </Link>
    </main>
  )
}
