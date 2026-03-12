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
    if (!confirm('Удалить эту цель?')) return

    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (goals.length === 0) {
    return <p className="text-gray-500">Нет активных целей</p>
  }

  return (
    <div className="space-y-2">
      {goals.map((goal) => (
        <div
          key={goal.id}
          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
        >
          <div>
            <div className="font-medium">{goal.name}</div>
            <div className="text-sm text-gray-400">
              {formatCurrency(Number(goal.targetAmount), goal.currency)}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(goal.startDate).toLocaleDateString('ru-RU')} —{' '}
              {new Date(goal.endDate).toLocaleDateString('ru-RU')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(goal.id)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Удалить
          </button>
        </div>
      ))}
    </div>
  )
}
