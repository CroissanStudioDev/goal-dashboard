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
    return <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
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
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
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
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-gray-800">
              <div className="font-medium text-white">{session.user.name}</div>
              <div className="text-sm text-gray-500">{session.user.email}</div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-800 rounded-b-lg"
            >
              Выйти
            </button>
          </div>
        </>
      )}
    </div>
  )
}
