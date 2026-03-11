'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Auto-refresh page at interval
 */
export function useAutoRefresh(intervalMs: number = 60_000) {
  const router = useRouter()
  
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, intervalMs)
    
    return () => clearInterval(interval)
  }, [router, intervalMs])
}
