'use client'

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react'
import { forwardRef } from 'react'

type Variant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'ghost'
  | 'success'

type Size = 'sm' | 'md' | 'lg'

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500',
  secondary:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-500',
  success:
    'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500',
}

const SIZES: Record<Size, string> = {
  sm: 'rounded-lg px-3 py-1.5 text-xs',
  md: 'rounded-lg px-4 py-2 text-sm',
  lg: 'rounded-xl px-6 py-3 text-base',
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonProps
>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className = '',
    disabled,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
})
