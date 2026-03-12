'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <label className="block space-y-2">
        {label && (
          <span className="block text-sm font-medium text-text-secondary">
            {label}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-xl
            bg-bg-muted border-0
            text-text placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-shadow duration-200
            ${error ? 'ring-2 ring-danger' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </label>
    )
  },
)

Input.displayName = 'Input'
