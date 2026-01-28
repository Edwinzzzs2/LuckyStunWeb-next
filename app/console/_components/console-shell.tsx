"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { ChevronLeft, ChevronRight, LayoutGrid, FolderTree, Globe, Users, Menu, Moon, Sun, LogOut, Home, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useConsoleAuth } from '@/app/console/_components/console-auth'
import { useConsoleToast } from '@/app/console/_components/console-toast'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const ConsoleShellContext = createContext<{ openSidebar: () => void } | null>(null)

export function useConsoleShell() {
  const ctx = useContext(ConsoleShellContext)
  if (!ctx) throw new Error('ConsoleShellContext')
  return ctx
}

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useConsoleAuth()
  const { push } = useConsoleToast()
  const { resolvedTheme, setTheme } = useTheme()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const openSidebar = useMemo(() => () => setMobileOpen(true), [])

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: '/console', label: '首页', icon: <LayoutGrid className="h-4 w-4" /> },
      { href: '/console/categories', label: '分类管理', icon: <FolderTree className="h-4 w-4" /> },
      { href: '/console/sites', label: '网站管理', icon: <Globe className="h-4 w-4" /> },
      { href: '/console/users', label: '后台管理', icon: <Users className="h-4 w-4" />, adminOnly: true },
    ],
    []
  )

  const visibleNav = navItems.filter((item) => !item.adminOnly || user?.isAdmin)

  const activeLabel = useMemo(() => {
    const hit = visibleNav.find((x) => x.href === pathname)
    return hit?.label || ''
  }, [visibleNav, pathname])

  function toggleTheme() {
    const effective = resolvedTheme === 'dark' ? 'dark' : 'light'
    setTheme(effective === 'dark' ? 'light' : 'dark')
  }

  async function onLogout() {
    try {
      await logout()
      push({ title: '已退出登录', tone: 'success' })
      router.replace('/console/login')
    } catch (e: any) {
      push({ title: '退出失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    }
  }

  function Sidebar({ variant }: { variant: 'desktop' | 'mobile' }) {
    const isDesktop = variant === 'desktop'
    const isCollapsed = isDesktop ? collapsed : false
    return (
      <aside
        className={cn(
          'flex h-full min-h-0 shrink-0 flex-col border-r bg-background',
          isDesktop ? (isCollapsed ? 'w-[84px]' : 'w-[280px]') : 'w-[280px]',
          variant === 'desktop' ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className={cn('flex items-center justify-between py-4', isCollapsed ? 'px-3' : 'px-5')}>
          <div className={cn('flex items-center gap-2', isCollapsed ? 'justify-center' : '')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </div>
            {!isCollapsed ? (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">WebStack</div>
                <div className="truncate text-xs text-muted-foreground">配置管理台</div>
              </div>
            ) : null}
          </div>

          {variant === 'mobile' ? null : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
              className={cn(isCollapsed ? 'mx-auto' : '')}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          )}
        </div>

        {!isCollapsed ? (
          <div className="px-5 pb-4">
            <div className="flex items-center gap-3 rounded-2xl border bg-muted/30 px-4 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user?.username || '-'}</div>
                <div className="truncate text-xs text-muted-foreground">{user?.isAdmin ? '管理员' : '用户'}</div>
              </div>
            </div>
          </div>
        ) : null}

        <nav className={cn('px-3', isCollapsed ? 'px-2' : '')}>
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">导航</div>
          ) : null}
          <div className={cn('grid gap-1', isCollapsed ? 'justify-items-center' : '')}>
            {visibleNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium',
                    active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
                  )}
                  onClick={() => setMobileOpen(false)}
                  title={item.label}
                >
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', active ? 'bg-primary/10' : 'bg-muted/50')}>
                    {item.icon}
                  </span>
                  {!isCollapsed ? <span>{item.label}</span> : null}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className={cn('mt-auto py-5', isCollapsed ? 'px-3' : 'px-5')}>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className={cn('justify-between', isCollapsed ? 'px-2' : '')}
              onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <Home className="h-4 w-4" />
                </span>
                {!isCollapsed ? '打开导航首页' : null}
              </span>
              {!isCollapsed ? <span className="text-xs text-muted-foreground">/</span> : null}
            </Button>
            <Button variant="outline" className={cn('justify-between', isCollapsed ? 'px-2' : '')} onClick={onLogout}>
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <LogOut className="h-4 w-4" />
                </span>
                {!isCollapsed ? '退出登录' : null}
              </span>
              {!isCollapsed ? <span className="text-xs text-muted-foreground">清除会话</span> : null}
            </Button>
            <Button
              variant="outline"
              className={cn('justify-between', isCollapsed ? 'px-2' : '')}
              onClick={toggleTheme}
              aria-label="切换主题"
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </span>
                {!isCollapsed ? '切换主题' : null}
              </span>
              {!isCollapsed ? <span className="text-xs text-muted-foreground">{resolvedTheme}</span> : null}
            </Button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <ConsoleShellContext.Provider value={{ openSidebar }}>
      <div className="flex h-[100dvh] w-full overflow-hidden">
        <Sidebar variant="desktop" />

      <div className="min-w-0 flex-1">
        <main className="h-[100dvh] overflow-y-auto overflow-x-hidden px-4 py-6 pb-24 md:px-6 md:pb-6">
          <div className="mx-auto w-full max-w-[1400px] min-w-0 2xl:max-w-[1600px]">{children}</div>
        </main>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 left-6 z-50 rounded-2xl md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="打开侧边栏"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 rounded-2xl md:hidden"
        onClick={toggleTheme}
        aria-label="切换主题"
      >
        {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0 overflow-y-auto" aria-label="移动端侧边栏">
            <SheetHeader className="sr-only">
              <SheetTitle>移动端侧边栏</SheetTitle>
            </SheetHeader>
            <Sidebar variant="mobile" />
          </SheetContent>
        </Sheet>
      </div>
    </ConsoleShellContext.Provider>
  )
}
