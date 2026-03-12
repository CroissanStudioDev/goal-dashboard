'use client'

import { useEffect, useState } from 'react'

export function LiveIndicator() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    setLastUpdate(new Date())

    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 60_000)

    return () => clearInterval(interval)
  }, [])

  if (!lastUpdate) return null

  const timeStr = lastUpdate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-2 text-gray-400">
      <span className="w-2 h-2 bg-green-500 rounded-full live-indicator" />
      <span className="text-sm">Обновлено в {timeStr}</span>
    </div>
  )
}
