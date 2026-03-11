'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="bg-black text-white">
        <main className="min-h-screen p-8 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">💀</div>
          <h1 className="text-2xl font-bold mb-2">Критическая ошибка</h1>
          <p className="text-gray-400 mb-6">
            {error.message || 'Приложение не может загрузиться'}
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Перезагрузить
          </button>
        </main>
      </body>
    </html>
  )
}
