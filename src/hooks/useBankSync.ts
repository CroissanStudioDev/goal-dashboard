'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface SyncResult {
  syncedAt: string
  totalAdded: number
  results: Array<{
    accountId: string
    bank: string
    status: string
    added?: number
    error?: string
  }>
}

interface UseBankSyncOptions {
  /** Polling interval in milliseconds (default: 10 minutes) */
  intervalMs?: number
  /** Whether to sync on mount */
  syncOnMount?: boolean
  /** Whether polling is enabled */
  enabled?: boolean
}

/**
 * Hook for polling bank transactions while page is open
 */
export function useBankSync(options: UseBankSyncOptions = {}) {
  const {
    intervalMs = 10 * 60 * 1000, // 10 minutes
    syncOnMount = true,
    enabled = true,
  } = options

  const router = useRouter()
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const sync = useCallback(async () => {
    if (isSyncing) return

    setIsSyncing(true)
    setError(null)

    try {
      const res = await fetch('/api/sync', { method: 'POST' })

      if (!res.ok) {
        throw new Error('Sync failed')
      }

      const data: SyncResult = await res.json()
      setLastSync(data)

      // Refresh page data if new transactions were added
      if (data.totalAdded > 0) {
        router.refresh()
      }

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync error')
      return null
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, router])

  // Sync on mount
  useEffect(() => {
    if (enabled && syncOnMount) {
      sync()
    }
  }, [enabled, sync, syncOnMount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling interval
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      sync()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [enabled, intervalMs, sync])

  // Sync when tab becomes visible
  useEffect(() => {
    if (!enabled) return

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sync()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled, sync])

  return {
    sync,
    isSyncing,
    lastSync,
    error,
  }
}
