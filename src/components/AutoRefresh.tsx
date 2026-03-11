'use client'

import { useAutoRefresh } from '@/hooks/useAutoRefresh'

interface AutoRefreshProps {
  intervalMs?: number
}

export function AutoRefresh({ intervalMs = 60_000 }: AutoRefreshProps) {
  useAutoRefresh(intervalMs)
  return null
}
