'use client'

import { useBankSync } from '@/hooks/useBankSync'
import { useSyncSettings } from '@/hooks/useSyncSettings'

interface SyncStatusProps {
  /** Show detailed status */
  verbose?: boolean
}

/**
 * Component that handles bank sync polling and shows status
 */
export function SyncStatus({ verbose = false }: SyncStatusProps) {
  const { intervalMs, isEnabled, isLoaded } = useSyncSettings()
  const { isSyncing, lastSync, error, sync } = useBankSync({
    intervalMs,
    syncOnMount: true,
    enabled: isLoaded && isEnabled,
  })

  if (!verbose) {
    // Minimal indicator
    return (
      <div className="flex items-center gap-2 text-sm text-text-muted">
        {isSyncing ? (
          <>
            <span className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span>Синхронизация...</span>
          </>
        ) : lastSync ? (
          <>
            <span className="w-2 h-2 bg-success rounded-full" />
            <span>
              {lastSync.totalAdded > 0
                ? `+${lastSync.totalAdded} новых`
                : 'Актуально'}
            </span>
          </>
        ) : error ? (
          <>
            <span className="w-2 h-2 bg-danger rounded-full" />
            <span>Ошибка синхронизации</span>
          </>
        ) : null}
      </div>
    )
  }

  // Verbose status
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary">Синхронизация банков</span>
        <button
          type="button"
          onClick={() => sync()}
          disabled={isSyncing}
          className="text-primary-text hover:text-primary disabled:opacity-50"
        >
          {isSyncing ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {lastSync && (
        <div className="text-text-muted">
          Последняя: {new Date(lastSync.syncedAt).toLocaleTimeString('ru-RU')}
          {lastSync.totalAdded > 0 && (
            <span className="text-success-text ml-2">
              +{lastSync.totalAdded} транзакций
            </span>
          )}
        </div>
      )}

      {error && <div className="text-danger-text">{error}</div>}

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
