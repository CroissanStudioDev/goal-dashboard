'use client'

import { useRouter } from 'next/navigation'
import type { Goal } from '@/db'
import { formatCurrency } from '@/lib/format'

interface GoalsListProps {
  goals: Goal[]
}

export function GoalsList({ goals }: GoalsListProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить цель?')) return

    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (goals.length === 0) {
    return <p className="text-sm text-text-muted">Нет активных целей</p>
  }

  return (
    <div className="space-y-2">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="flex items-center justify-between p-4 bg-bg-elevated rounded-xl"
        >
          <div>
            <div className="font-medium text-sm">{goal.name}</div>
            <div className="text-xs text-text-muted mt-1">
              {formatCurrency(Number(goal.targetAmount), goal.currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(goal.id)}
            className="text-xs text-danger hover:opacity-70 transition-opacity"
          >
            Удалить
          </button>
        </div>
      ))}
    </div>
  )
}
