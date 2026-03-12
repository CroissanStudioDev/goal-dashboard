'use client'

import { useBankSync } from '@/hooks/useBankSync'
import { useSyncSettings } from '@/hooks/useSyncSettings'

export function SyncStatus() {
  const { intervalMs, isEnabled, isLoaded } = useSyncSettings()
  const { isSyncing, error } = useBankSync({
    intervalMs,
    syncOnMount: true,
    enabled: isLoaded && isEnabled,
  })

  if (!isLoaded) return null

  if (error) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-bg-elevated border border-danger/20 rounded-xl px-4 py-3 text-sm text-danger shadow-lg">
        Ошибка синхронизации
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-bg-elevated border border-border rounded-xl px-4 py-3 text-sm text-text-muted shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Синхронизация...
      </div>
    )
  }

  return null
}
