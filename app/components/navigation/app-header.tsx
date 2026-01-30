import type * as React from 'react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { NetworkType } from '@/hooks/use-navigation-preferences'
import { Check, ChevronDown, Github, Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, Wifi, X } from 'lucide-react'

const networkName: Record<NetworkType, string> = { main: '外网', backup: '备用', internal: '内网' }

type AppHeaderProps = {
  search: string
  onSearchChange: (value: string) => void
  searchInputRef: React.RefObject<HTMLInputElement | null>
  network: NetworkType
  onNetworkChange: (type: NetworkType) => void
  onToggleSidebar: () => void
  onOpenMobileSidebar: () => void
  sidebarCollapsed: boolean
  resolvedTheme?: string
  onToggleTheme?: () => void
}

export function AppHeader({
  search,
  onSearchChange,
  searchInputRef,
  network,
  onNetworkChange,
  onToggleSidebar,
  onOpenMobileSidebar,
  sidebarCollapsed,
  resolvedTheme,
  onToggleTheme,
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
            className="h-9 w-9 lg:h-10 lg:w-10"
            onClick={() => {
              if (window.innerWidth >= 1024) onToggleSidebar()
              else onOpenMobileSidebar()
            }}
          >
            {sidebarCollapsed ? (
              <Menu className="h-5 w-5 lg:h-6 lg:w-6" />
            ) : (
              <Menu className="h-5 w-5 lg:h-6 lg:w-6" />
            )}
          </Button>
          <div className="hidden lg:flex items-center gap-2">
            <div className="font-semibold text-sm md:text-base whitespace-nowrap">LuckyStunWeb导航</div>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-center">
          <div className="w-full max-w-[560px] relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <i className="iconfont icon-biaoqian text-[16px] leading-none" aria-hidden="true" />
            </div>
            <Input
              ref={searchInputRef}
              id="searchInput"
              type="text"
              placeholder="请输入关键字"
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

        <div className="flex items-center gap-0.5 ml-auto">
          <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button
                 variant="ghost"
                 size="icon"
                 aria-label={`网络：${networkName[network]}`}
                 title={`网络：${networkName[network]}`}
                 className="relative h-9 w-9 lg:h-10 lg:w-10"
               >
                 <Wifi className="h-5 w-5 lg:h-[22px] lg:w-[22px]" />
                 <span
                   className={cn(
                     'absolute top-1 right-1 h-2 w-2 rounded-full ring-2 ring-background',
                     network === 'backup' ? 'bg-orange-500' : network === 'internal' ? 'bg-indigo-500' : 'bg-green-500'
                   )}
                 />
               </Button>
             </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              {(['main', 'backup', 'internal'] as const).map((k) => (
                <DropdownMenuItem key={k} onSelect={() => onNetworkChange(k)} className="gap-2.5 py-2">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      k === 'main' ? 'bg-green-500' : k === 'backup' ? 'bg-orange-500' : 'bg-indigo-500'
                    )}
                  />
                  <span className="text-sm font-medium">{networkName[k]}</span>
                  {network === k && <Check className="ml-auto h-3.5 w-3.5 opacity-60" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label="切换主题"
            title="切换主题"
            className="h-9 w-9 lg:h-10 lg:w-10"
          >
            {resolvedTheme === 'dark' ? (
              <Moon className="h-5 w-5 lg:h-[22px] lg:w-[22px]" />
            ) : (
              <Sun className="h-5 w-5 lg:h-[22px] lg:w-[22px]" />
            )}
          </Button> */}
          <Button asChild variant="ghost" size="icon" aria-label="打开 GitHub" title="打开 GitHub" className="h-9 w-9 lg:h-10 lg:w-10">
            <a href="https://github.com/" target="_blank" rel="noreferrer">
              <Github className="h-5 w-5 lg:h-[22px] lg:w-[22px]" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
