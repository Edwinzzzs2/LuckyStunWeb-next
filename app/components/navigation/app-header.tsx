import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { NetworkType } from '@/hooks/use-navigation-preferences'
import { Check, ChevronDown, Github, Moon, PanelLeftClose, PanelLeftOpen, Sun, Wifi, X } from 'lucide-react'

const networkName: Record<NetworkType, string> = { main: '外网', backup: '备用', internal: '内网' }

type AppHeaderProps = {
  search: string
  onSearchChange: (value: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  network: NetworkType
  onNetworkChange: (type: NetworkType) => void
  resolvedTheme?: string
  onToggleTheme: () => void
  onToggleSidebar: () => void
  onOpenMobileSidebar: () => void
  sidebarCollapsed: boolean
}

export function AppHeader({
  search,
  onSearchChange,
  searchInputRef,
  network,
  onNetworkChange,
  resolvedTheme,
  onToggleTheme,
  onToggleSidebar,
  onOpenMobileSidebar,
  sidebarCollapsed,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
      <div className="h-14 px-4 lg:px-7 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="切换侧边栏"
            title="切换侧边栏"
            onClick={() => {
              if (window.innerWidth >= 1024) onToggleSidebar()
              else onOpenMobileSidebar()
            }}
          >
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
          <div className="hidden lg:flex items-center gap-2">
            <div className="font-semibold">导航</div>
          </div>
        </div>

        <div className="flex-1 min-w-0 hidden md:flex items-center justify-center">
          <div className="w-full max-w-[560px] relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <i className="iconfont icon-biaoqian text-[16px] leading-none" aria-hidden="true" />
            </div>
            <Input
              ref={searchInputRef}
              id="searchInput"
              type="text"
              placeholder="搜索导航..."
              className={cn('pl-9', search ? 'pr-16' : 'pr-10')}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {search ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute inset-y-0 right-2 my-auto h-7 w-7"
                aria-label="清空搜索"
                title="清空搜索"
                onClick={() => {
                  onSearchChange('')
                  requestAnimationFrame(() => {
                    searchInputRef.current?.focus()
                  })
                }}
              >
                <X className="h-4 w-4 opacity-70" />
              </Button>
            ) : null}
            <div
              className={cn(
                'pointer-events-none absolute inset-y-0 hidden lg:flex items-center text-muted-foreground',
                search ? 'right-10' : 'right-3'
              )}
            >
              <span className="text-[11px] px-1.5 py-0.5 rounded-md border border-border bg-background">⌘ K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label={`网络：${networkName[network]}`}
                title={`网络：${networkName[network]}`}
                className="relative"
              >
                <Wifi />
                <span
                  className={cn(
                    'absolute top-2 right-2 h-2 w-2 rounded-full ring-2 ring-background',
                    network === 'backup' ? 'bg-amber-500' : network === 'internal' ? 'bg-sky-500' : 'bg-emerald-500'
                  )}
                />
                <ChevronDown className="absolute bottom-1 right-1 h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {(['main', 'backup', 'internal'] as const).map((k) => (
                <DropdownMenuItem key={k} onSelect={() => onNetworkChange(k)} className="gap-2">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      k === 'main' ? 'bg-emerald-500' : k === 'backup' ? 'bg-amber-500' : 'bg-sky-500'
                    )}
                  />
                  <span className="text-sm">{networkName[k]}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{k === 'main' ? 'Main' : k === 'backup' ? 'Backup' : 'LAN'}</span>
                    {network === k ? <Check className="h-4 w-4" /> : <span className="h-4 w-4" />}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" onClick={onToggleTheme} aria-label="切换主题" title="切换主题">
            {resolvedTheme === 'dark' ? <Moon /> : <Sun />}
          </Button>

          <Button asChild variant="ghost" size="icon" aria-label="打开 GitHub" title="打开 GitHub">
            <a href="https://github.com/" target="_blank" rel="noreferrer">
              <Github />
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
