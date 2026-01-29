import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { ConsoleProviders } from './providers'

export const metadata: Metadata = {
  title: 'LuckyStun - 管理后台',
  icons: {
    icon: '/console-favicon.svg',
  },
}

export default function ConsoleRootLayout({ children }: { children: ReactNode }) {
  return <ConsoleProviders>{children}</ConsoleProviders>
}
