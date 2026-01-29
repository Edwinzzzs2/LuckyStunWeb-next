import './globals.css'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { PwaRegister } from '@/app/components/pwa/pwa-register'

export const metadata: Metadata = {
  title: 'LuckyStun - 个人导航页',
  icons: {
    icon: '/favicon.svg',
    apple: '/pwa-192.svg',
  },
  manifest: '/manifest.webmanifest',
}

export const viewport = {
  themeColor: '#0b0f19',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/icon-font/iconfont.css" />
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
