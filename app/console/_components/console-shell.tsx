"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { ChevronLeft, ChevronRight, LayoutGrid, FolderTree, Globe, Users, Menu, Moon, Sun, LogOut, Home, X, ArrowUp, ClipboardList, Power, Loader2, Monitor, Image } from 'lucide-react'
import { RestartDialog } from './restart-dialog'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { PullToRefresh } from '@/app/components/ui/pull-to-refresh'
import { useConsoleAuth } from '@/app/console/_components/console-auth'
import { useConsoleToast } from '@/app/console/_components/console-toast'
import { restartService } from '@/app/actions/admin-actions'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const ConsoleShellContext = createContext<{ openSidebar: () => void; setRefreshHandler: (fn: (() => Promise<void>) | null) => void } | null>(null)

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
  const { resolvedTheme, setTheme, theme } = useTheme()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isAutoCollapsed, setIsAutoCollapsed] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [pullEnabled, setPullEnabled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const refreshHandlerRef = useRef<(() => Promise<void>) | null>(null)
  const [isRestarting, setIsRestarting] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showRestartDialog, setShowRestartDialog] = useState(false)

  async function handleRestart() {
    setShowRestartDialog(true)
  }

  async function confirmRestart() {
    setIsRestarting(true)
    try {
      const res = await restartService()
      if (res.success) {
        push({ title: '已发送重启指令', detail: res.message, tone: 'success' })
      } else {
        push({ title: '重启失败', detail: res.message, tone: 'danger' })
      }
    } catch (e: any) {
      push({ title: '操作异常', detail: e.message, tone: 'danger' })
    } finally {
      setIsRestarting(false)
      setShowRestartDialog(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    const main = scrollRef.current
    if (!main) return

    const handleScroll = () => {
      setShowScrollTop(main.scrollTop > 300)
    }

    main.addEventListener('scroll', handleScroll)
    return () => main.removeEventListener('scroll', handleScroll)
  }, [])

  function scrollToTop() {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px) and (max-width: 1280px)')
    const onChange = () => setIsAutoCollapsed(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const effectiveCollapsed = collapsed || isAutoCollapsed

  const openSidebar = useMemo(() => () => setMobileOpen(true), [])

  const setRefreshHandler = useMemo(
    () => (fn: (() => Promise<void>) | null) => {
      refreshHandlerRef.current = fn
      setPullEnabled(Boolean(fn))
    },
    []
  )

  const handleRefresh = useMemo(
    () => async () => {
      const fn = refreshHandlerRef.current
      if (fn) await fn()
      else router.refresh()
      await new Promise((resolve) => setTimeout(resolve, 800))
    },
    [router]
  )

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: '/console', label: '首页', icon: <LayoutGrid className="h-4 w-4" /> },
      { href: '/console/categories', label: '分类管理', icon: <FolderTree className="h-4 w-4" /> },
      { href: '/console/sites', label: '网站管理', icon: <Globe className="h-4 w-4" /> },
      { href: '/console/users', label: '后台管理', icon: <Users className="h-4 w-4" />, adminOnly: true },
      { href: '/console/icons', label: '图标管理', icon: <Image className="h-4 w-4" />, adminOnly: true },
      { href: '/console/webhook-logs', label: '日志', icon: <ClipboardList className="h-4 w-4" />, adminOnly: true },
    ],
    []
  )

  const visibleNav = navItems.filter((item) => !item.adminOnly || user?.isAdmin)

  const activeLabel = useMemo(() => {
    const hit = visibleNav.find((x) => x.href === pathname)
    return hit?.label || ''
  }, [visibleNav, pathname])

  function toggleTheme() {
    const current = theme === 'system' ? 'system' : resolvedTheme === 'dark' ? 'dark' : 'light'
    setTheme(current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light')
  }

  const themeLabel = !mounted ? '自动' : theme === 'system' ? '自动' : resolvedTheme === 'dark' ? '深色' : '浅色'

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
    const isCollapsed = isDesktop ? effectiveCollapsed : false
    return (
      <aside
        className={cn(
          'flex h-full min-h-0 shrink-0 flex-col border-r bg-background transition-all duration-300',
          isDesktop ? (isCollapsed ? 'w-[84px]' : 'w-[280px]') : 'w-[280px]',
          variant === 'desktop' ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className={cn('flex items-center py-4', isCollapsed ? 'flex-col gap-4 px-0' : 'justify-between px-5')}>
          <div className={cn('flex items-center gap-2', isCollapsed ? 'flex-col' : '')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
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
              onClick={() => {
                if (isAutoCollapsed) {
                  setIsAutoCollapsed(false)
                  setCollapsed(false)
                } else {
                  setCollapsed((v) => !v)
                }
              }}
              aria-label={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
              className={cn(isCollapsed ? '' : '')}
            >
              {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
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
              {user?.isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={handleRestart}
                  disabled={isRestarting}
                  title="重启服务"
                >
                  {isRestarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                </Button>
              )}
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
                  {mounted ? (theme === 'system' ? <Monitor className="h-4 w-4" /> : resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : (
                    <Monitor className="h-4 w-4" />
                  )}
                </span>
                {!isCollapsed ? '切换主题' : null}
              </span>
              {!isCollapsed ? <span className="text-xs text-muted-foreground">{themeLabel}</span> : null}
            </Button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <ConsoleShellContext.Provider value={{ openSidebar, setRefreshHandler }}>
      <div className="fixed inset-0 flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar variant="desktop" />

          <div className="flex min-w-0 flex-1 flex-col">
            <PullToRefresh
              ref={scrollRef}
              disabled={!pullEnabled}
              onRefresh={pullEnabled ? handleRefresh : undefined}
              role="main"
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6"
            >
              <div className="mx-auto w-full max-w-[1400px] min-w-0 py-6 pb-24 md:pb-6 2xl:max-w-[1600px]">{children}</div>
            </PullToRefresh>
          </div>
        </div>

      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-6 z-50 flex flex-col gap-3">
        {showScrollTop && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl shadow-lg bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            onClick={scrollToTop}
            aria-label="回到顶部"
            title="回到顶部"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          className="rounded-2xl shadow-lg bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          onClick={toggleTheme}
          aria-label="切换主题"
        >
          {mounted ? (theme === 'system' ? <Monitor className="h-4 w-4" /> : resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : (
            <Monitor className="h-4 w-4" />
          )}
        </Button>
      </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0 overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]" aria-label="移动端侧边栏">
            <SheetHeader className="sr-only">
              <SheetTitle>移动端侧边栏</SheetTitle>
            </SheetHeader>
            <Sidebar variant="mobile" />
          </SheetContent>
        </Sheet>

        <RestartDialog
          open={showRestartDialog}
          onOpenChange={setShowRestartDialog}
          onConfirm={confirmRestart}
          isRestarting={isRestarting}
        />
      </div>
    </ConsoleShellContext.Provider>
  )
}
