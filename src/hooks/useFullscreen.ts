'use client'

import { useCallback, useEffect, useState } from 'react'

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const enterFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.()
  }, [])

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen?.()
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen()
    } else {
      enterFullscreen()
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen])

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen }
}
