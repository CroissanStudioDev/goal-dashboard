'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signOut, useSession } from '@/lib/auth-client'

export function UserMenu() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/sign-in')
    router.refresh()
  }

  if (isPending) {
    return <div className="w-8 h-8 rounded-full bg-bg-muted animate-pulse" />
  }

  if (!session) {
    return null
  }

  const initials =
    session.user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium hover:opacity-90 transition-opacity"
      >
        {initials}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            aria-label="Закрыть меню"
          />
          <div className="absolute right-0 mt-2 w-48 bg-bg-elevated rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="p-3 border-b border-border">
              <div className="text-sm font-medium">{session.user.name}</div>
              <div className="text-xs text-text-muted">{session.user.email}</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2.5 text-sm text-danger hover:bg-bg-muted transition-colors"
            >
              Выйти
            </button>
          </div>
        </>
      )}
    </div>
  )
}
