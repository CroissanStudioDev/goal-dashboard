import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-bg-elevated rounded-2xl p-8 ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardProps) {
  return <div className={`mb-6 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: CardProps) {
  return (
    <h2 className={`text-lg font-semibold text-text ${className}`}>
      {children}
    </h2>
  )
}

export function CardContent({ children, className = '' }: CardProps) {
  return <div className={className}>{children}</div>
}
