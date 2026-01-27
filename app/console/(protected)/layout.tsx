"use client"

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import { ConsoleShell } from '@/app/console/_components/console-shell'
import { useConsoleAuth } from '@/app/console/_components/console-auth'

export default function ConsoleProtectedLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useConsoleAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace(`/console/login?next=${encodeURIComponent(pathname)}`)
  }, [isLoading, user, router, pathname])

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  return <ConsoleShell>{children}</ConsoleShell>
}

