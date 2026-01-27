import './globals.css'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'

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
      </body>
    </html>
  )
}
