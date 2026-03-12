'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-primary hover:bg-primary-hover text-text',
  secondary: 'bg-bg-subtle hover:bg-bg-muted text-text',
  danger: 'bg-danger hover:opacity-90 text-text',
  ghost: 'bg-transparent hover:bg-bg-muted text-text-secondary',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', className = '', children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={`
          ${variants[variant]}
          ${sizes[size]}
          rounded-lg font-medium transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
