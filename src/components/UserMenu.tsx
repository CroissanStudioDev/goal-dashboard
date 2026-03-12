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
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
          {initials}
        </div>
        <span className="hidden md:inline">{session.user.name}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute right-0 mt-2 w-56 bg-bg-elevated rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="font-medium text-text">{session.user.name}</div>
              <div className="text-sm text-text-muted mt-0.5">
                {session.user.email}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-bg-muted transition-colors"
            >
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
