"use client"

import type { ReactNode } from 'react'

import { ConsoleAuthProvider } from '@/app/console/_components/console-auth'
import { ConsoleToastProvider } from '@/app/console/_components/console-toast'

export default function ConsoleRootLayout({ children }: { children: ReactNode }) {
  return (
    <ConsoleAuthProvider>
      <ConsoleToastProvider>{children}</ConsoleToastProvider>
    </ConsoleAuthProvider>
  )
}

