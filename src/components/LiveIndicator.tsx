'use client'

import { useEffect, useState } from 'react'

export function LiveIndicator() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!time) return null

  return (
    <div className="flex items-center gap-2 text-sm text-text-muted">
      <span className="w-1.5 h-1.5 rounded-full bg-success" />
      <span>{time}</span>
    </div>
  )
}
