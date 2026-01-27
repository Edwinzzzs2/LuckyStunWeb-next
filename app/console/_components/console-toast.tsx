"use client"

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

type ToastTone = 'info' | 'success' | 'warning' | 'danger'

type ToastItem = {
  id: string
  title: string
  detail?: string
  tone: ToastTone
}

type ToastContextValue = {
  push: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useConsoleToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useConsoleToast must be used within ConsoleToastProvider')
  return ctx
}

export function ConsoleToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const item: ToastItem = { id, ...toast }
    setToasts((prev) => [...prev, item])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 2600)
  }, [])

  const value = useMemo(() => ({ push }), [push])

  const toneClass: Record<ToastTone, string> = {
    info: 'border-border bg-card',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-50',
    warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-50',
    danger: 'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-50',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex w-[min(520px,calc(100%-2rem))] -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn('pointer-events-auto overflow-hidden rounded-2xl border px-4 py-3 shadow-sm', toneClass[t.tone])}
          >
            <div className="text-sm font-semibold">{t.title}</div>
            {t.detail ? <div className="mt-0.5 text-sm text-muted-foreground">{t.detail}</div> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

