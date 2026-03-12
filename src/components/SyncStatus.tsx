'use client'

import { useBankSync } from '@/hooks/useBankSync'

interface SyncStatusProps {
  /** Polling interval in minutes */
  intervalMinutes?: number
  /** Show detailed status */
  verbose?: boolean
}

/**
 * Component that handles bank sync polling and shows status
 */
export function SyncStatus({
  intervalMinutes = 10,
  verbose = false,
}: SyncStatusProps) {
  const { isSyncing, lastSync, error, sync } = useBankSync({
    intervalMs: intervalMinutes * 60 * 1000,
    syncOnMount: true,
    enabled: true,
  })

  if (!verbose) {
    // Minimal indicator
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {isSyncing ? (
          <>
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span>Синхронизация...</span>
          </>
        ) : lastSync ? (
          <>
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span>
              {lastSync.totalAdded > 0
                ? `+${lastSync.totalAdded} новых`
                : 'Актуально'}
            </span>
          </>
        ) : error ? (
          <>
            <span className="w-2 h-2 bg-red-500 rounded-full" />
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
        <span className="text-gray-400">Синхронизация банков</span>
        <button
          type="button"
          onClick={() => sync()}
          disabled={isSyncing}
          className="text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          {isSyncing ? 'Загрузка...' : 'Обновить'}
        </button>
      </div>

      {lastSync && (
        <div className="text-gray-500">
          Последняя: {new Date(lastSync.syncedAt).toLocaleTimeString('ru-RU')}
          {lastSync.totalAdded > 0 && (
            <span className="text-green-400 ml-2">
              +{lastSync.totalAdded} транзакций
            </span>
          )}
        </div>
      )}

      {error && <div className="text-red-400">{error}</div>}

      {lastSync?.results && (
        <div className="space-y-1">
          {lastSync.results.map((r) => (
            <div
              key={`${r.bank}-${r.accountId}`}
              className="text-xs text-gray-600"
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
