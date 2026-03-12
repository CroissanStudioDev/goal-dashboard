'use client'

import { useBankSync } from '@/hooks/useBankSync'
import { useSyncSettings } from '@/hooks/useSyncSettings'

interface SyncStatusProps {
  verbose?: boolean
}

export function SyncStatus({ verbose = false }: SyncStatusProps) {
  const { intervalMs, isEnabled, isLoaded } = useSyncSettings()
  const { isSyncing, lastSync, error, sync } = useBankSync({
    intervalMs,
    syncOnMount: true,
    enabled: isLoaded && isEnabled,
  })

  if (!verbose) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        {isSyncing ? (
          <>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span>Syncing...</span>
          </>
        ) : lastSync ? (
          <>
            <span className="w-1.5 h-1.5 bg-success rounded-full" />
            <span>
              {lastSync.totalAdded > 0
                ? `+${lastSync.totalAdded} new`
                : 'Up to date'}
            </span>
          </>
        ) : error ? (
          <>
            <span className="w-1.5 h-1.5 bg-danger rounded-full" />
            <span>Sync error</span>
          </>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary">Bank Sync</span>
        <button
          type="button"
          onClick={() => sync()}
          disabled={isSyncing}
          className="text-primary hover:text-primary-hover disabled:opacity-50 transition-colors"
        >
          {isSyncing ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {lastSync && (
        <div className="text-text-muted">
          Last sync: {new Date(lastSync.syncedAt).toLocaleTimeString('ru-RU')}
          {lastSync.totalAdded > 0 && (
            <span className="text-success ml-2">
              +{lastSync.totalAdded} transactions
            </span>
          )}
        </div>
      )}

      {error && <div className="text-danger">{error}</div>}

      {lastSync?.results && (
        <div className="space-y-1">
          {lastSync.results.map((r) => (
            <div
              key={`${r.bank}-${r.accountId}`}
              className="text-xs text-text-subtle"
            >
              {r.bank}: {r.status}
              {r.added !== undefined && r.added > 0 && ` (+${r.added})`}
              {r.error && ` - ${r.error}`}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
