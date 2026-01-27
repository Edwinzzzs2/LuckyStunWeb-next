"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { LayoutGrid, FolderTree, Globe, Users, Menu, Moon, Sun, LogOut, Home, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useConsoleAuth } from '@/app/console/_components/console-auth'
import { useConsoleToast } from '@/app/console/_components/console-toast'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useConsoleAuth()
  const { push } = useConsoleToast()
  const { resolvedTheme, setTheme } = useTheme()

  const [mobileOpen, setMobileOpen] = useState(false)

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
    return (
      <aside
        className={cn(
          'flex h-full w-[280px] shrink-0 flex-col border-r bg-background',
          variant === 'desktop' ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">WebStack</div>
              <div className="truncate text-xs text-muted-foreground">配置管理台</div>
            </div>
          </div>
          {variant === 'mobile' ? (
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="关闭侧边栏">
              <X className="h-5 w-5" />
            </Button>
          ) : null}
        </div>

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

        <nav className="px-3">
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">导航</div>
          <div className="grid gap-1">
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
                >
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', active ? 'bg-primary/10' : 'bg-muted/50')}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="mt-auto px-5 py-5">
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-between"
              onClick={() => window.open('/', '_blank', 'noopener,noreferrer')}
            >
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <Home className="h-4 w-4" />
                </span>
                打开导航首页
              </span>
              <span className="text-xs text-muted-foreground">/</span>
            </Button>
            <Button variant="outline" className="justify-between" onClick={onLogout}>
              <span className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
                  <LogOut className="h-4 w-4" />
                </span>
                退出登录
              </span>
              <span className="text-xs text-muted-foreground">清除会话</span>
            </Button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden">
      <Sidebar variant="desktop" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b bg-background px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="打开侧边栏">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">管理后台</div>
              <div className="truncate text-xs text-muted-foreground">{pathname}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="切换主题">
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <main className="h-[calc(100dvh-53px)] overflow-auto px-4 py-6 md:px-6">
          <div className="mx-auto max-w-[1200px]">{children}</div>
        </main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0" aria-label="移动端侧边栏">
          <Sidebar variant="mobile" />
        </SheetContent>
      </Sheet>
    </div>
  )
}
