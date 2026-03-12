'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Goal } from '@/db'

interface ExclusionsListProps {
  goal: Goal
}

export function ExclusionsList({ goal }: ExclusionsListProps) {
  const router = useRouter()
  const [newExclusion, setNewExclusion] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const updateExclusions = async (exclusions: string[]) => {
    await fetch(`/api/goals/${goal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excludeCounterparties: exclusions }),
    })
    router.refresh()
  }

  const handleAdd = async () => {
    const trimmed = newExclusion.trim()
    if (!trimmed) return

    setIsAdding(true)
    await updateExclusions([...goal.excludeCounterparties, trimmed])
    setNewExclusion('')
    setIsAdding(false)
  }

  const handleRemove = async (exclusion: string) => {
    await updateExclusions(
      goal.excludeCounterparties.filter((e) => e !== exclusion)
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-3">
      {goal.excludeCounterparties.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {goal.excludeCounterparties.map((exclusion) => (
            <span
              key={exclusion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-elevated rounded-full text-sm"
            >
              {exclusion}
              <button
                type="button"
                onClick={() => handleRemove(exclusion)}
                className="text-text-muted hover:text-danger transition-colors"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">Нет исключений</p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newExclusion}
          onChange={(e) => setNewExclusion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Название контрагента"
          className="flex-1 px-3 py-2 bg-bg-elevated rounded-lg text-sm border-0 outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding || !newExclusion.trim()}
          className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors"
        >
          Добавить
        </button>
      </div>
      <p className="text-xs text-text-muted">
        Транзакции с этими контрагентами не учитываются в расчёте цели
      </p>
    </div>
  )
}
