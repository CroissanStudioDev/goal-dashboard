import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-bg-elevated rounded-xl border border-border p-6 ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h2 className={`text-xl font-semibold text-white ${className}`}>
      {children}
    </h2>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={className}>{children}</div>
}
