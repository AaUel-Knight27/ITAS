'use client'

import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

type ToastType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  toast: (
    message: string,
    type?: ToastType,
    duration?: number
  ) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext =
  createContext<ToastContextValue | null>(null)

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-green-700 bg-green-900/90 text-green-100',
  error: 'border-red-700 bg-red-900/90 text-red-100',
  info: 'border-blue-700 bg-blue-900/90 text-blue-100',
  warning: 'border-yellow-700 bg-yellow-900/90 text-yellow-100',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-yellow-400',
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast
  onRemove: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const inTimer = window.setTimeout(
      () => setVisible(true),
      10
    )

    const outTimer = window.setTimeout(() => {
      setVisible(false)
      window.setTimeout(
        () => onRemove(toast.id),
        300
      )
    }, Math.max(300, toast.duration - 300))

    return () => {
      window.clearTimeout(inTimer)
      window.clearTimeout(outTimer)
    }
  }, [toast.duration, toast.id, onRemove])

  return (
    <div
      className={`max-w-sm w-full cursor-pointer select-none rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm transition-all duration-300 ${TOAST_STYLES[toast.type]} ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0'
      }`}
      onClick={() => {
        setVisible(false)
        window.setTimeout(
          () => onRemove(toast.id),
          300
        )
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/20 text-sm font-bold ${ICON_STYLES[toast.type]}`}
        >
          {TOAST_ICONS[toast.type]}
        </span>
        <p className="flex-1 text-sm leading-snug">
          {toast.message}
        </p>
      </div>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error(
      'useToast must be inside ToastProvider'
    )
  }
  return ctx
}

export function ToastProvider({
  children,
}: {
  children: ReactNode
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    )
  }, [])

  const add = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      duration = 3500
    ) => {
      const id = Math.random()
        .toString(36)
        .slice(2)

      setToasts((prev) => [
        ...prev,
        { id, message, type, duration },
      ])
    },
    []
  )

  const value = useMemo<ToastContextValue>(() => ({
    toast: add,
    success: (message) => add(message, 'success'),
    error: (message) => add(message, 'error'),
    info: (message) => add(message, 'info'),
    warning: (message) => add(message, 'warning'),
  }), [add])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex items-end"
      >
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={remove}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
