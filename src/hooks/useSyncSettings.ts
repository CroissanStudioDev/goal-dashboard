'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'goal-dashboard:sync-interval'
const DEFAULT_INTERVAL = 10 // minutes

export function useSyncSettings() {
  const [intervalMinutes, setIntervalMinutes] = useState(DEFAULT_INTERVAL)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed) && parsed >= 0) {
        setIntervalMinutes(parsed)
      }
    }
    setIsLoaded(true)
  }, [])

  const setInterval = useCallback((minutes: number) => {
    const value = Math.max(0, Math.floor(minutes))
    setIntervalMinutes(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }, [])

  return {
    intervalMinutes,
    setInterval,
    isLoaded,
    intervalMs: intervalMinutes * 60 * 1000,
    isEnabled: intervalMinutes > 0,
  }
}
