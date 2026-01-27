import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { NetworkType } from '@/hooks/use-navigation-preferences'

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
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
      <div className="h-14 px-4 lg:px-7 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="切换侧边栏"
            onClick={() => {
              if (window.innerWidth >= 1024) onToggleSidebar()
              else onOpenMobileSidebar()
            }}
          >
            <i className="iconfont icon-daohang2 text-[18px] leading-none" aria-hidden="true" />
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
              className="pl-9 pr-10"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 hidden lg:flex items-center text-muted-foreground">
              <span className="text-[11px] px-1.5 py-0.5 rounded-md border border-border bg-background">⌘ K</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <i className="iconfont icon-fuwuzhuangtaijiankong text-[18px] leading-none" aria-hidden="true" />
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    network === 'backup' ? 'bg-amber-500' : network === 'internal' ? 'bg-sky-500' : 'bg-emerald-500'
                  )}
                />
                <span className="text-sm font-medium">{networkName[network]}</span>
                <span className="opacity-70">▾</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(['main', 'backup', 'internal'] as const).map((k) => (
                <DropdownMenuItem key={k} onSelect={() => onNetworkChange(k)}>
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      k === 'main' ? 'bg-emerald-500' : k === 'backup' ? 'bg-amber-500' : 'bg-sky-500'
                    )}
                  />
                  <span className="text-sm">{networkName[k]}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{k === 'main' ? 'Main' : k === 'backup' ? 'Backup' : 'LAN'}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={onToggleTheme}>
            <i className={cn('iconfont', resolvedTheme === 'dark' ? 'icon-huoshanyun' : 'icon-tengxunyun', 'text-[18px] leading-none')} aria-hidden="true" />
            <span className="text-sm font-medium">主题</span>
          </Button>

          <Button asChild variant="ghost" className="h-10 px-3 rounded-lg">
            <a href="https://github.com/" target="_blank" rel="noreferrer">
              <i className="iconfont icon-zhubao-youlian text-[18px] leading-none" aria-hidden="true" />
              <span className="hidden sm:inline text-sm font-medium">GitHub</span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}

