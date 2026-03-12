'use client'

import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-primary hover:bg-primary-hover text-white',
  secondary:
    'border border-border hover:border-primary hover:text-primary text-text bg-transparent',
  ghost: 'hover:bg-bg-muted text-text-secondary hover:text-text bg-transparent',
  danger: 'bg-danger hover:opacity-90 text-white',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
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
          rounded-full font-medium transition-all duration-200
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
