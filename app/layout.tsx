import './globals.css'
import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { PwaRegister } from '@/app/components/pwa/pwa-register'
import { logSystemStartupOnce } from '@/lib/logger'
import { getIconfontUrl } from '@/lib/settings'

void logSystemStartupOnce()

export const metadata: Metadata = {
  title: 'LuckyStun - 个人导航页',
  icons: {
    icon: '/favicon.svg',
    apple: '/pwa-192.svg',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LuckyStun - 个人导航页',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0f19' },
  ],
  viewportFit: 'cover',
}

export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const iconfontUrl = await getIconfontUrl()
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href={iconfontUrl} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  )
}
