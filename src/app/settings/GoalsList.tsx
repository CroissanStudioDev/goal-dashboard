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
    if (!confirm('Delete this goal?')) return

    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (goals.length === 0) {
    return <p className="text-text-muted text-sm">No active goals</p>
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="flex items-center justify-between p-4 bg-bg-muted rounded-xl"
        >
          <div>
            <div className="font-medium">{goal.name}</div>
            <div className="text-sm text-text-muted mt-1">
              {formatCurrency(Number(goal.targetAmount), goal.currency)}
            </div>
            <div className="text-xs text-text-subtle mt-1">
              {new Date(goal.startDate).toLocaleDateString('ru-RU')} —{' '}
              {new Date(goal.endDate).toLocaleDateString('ru-RU')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(goal.id)}
            className="text-danger hover:opacity-70 text-sm transition-opacity"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
