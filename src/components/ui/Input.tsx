'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <label className="block space-y-1">
        {label && (
          <span className="block text-sm font-medium text-text-secondary">
            {label}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2 rounded-lg
            bg-bg-muted border border-border-muted
            text-text placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-danger' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-danger-text">{error}</p>}
      </label>
    )
  },
)

Input.displayName = 'Input'
