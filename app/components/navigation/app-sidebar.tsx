import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MenuGroup, MenuItem } from '@/data/navigation/types'

type SidebarVariant = 'desktop' | 'mobile'

type AppSidebarProps = {
  variant: SidebarVariant
  menuGroups: MenuGroup[]
  activeSectionId: string
  expandedMenus: Set<string>
  onSelectSection: (id: string) => void
  onToggleExpanded: (id: string) => void
  onOpenConsole: () => void
  onRequestClose?: () => void
  className?: string
}

function hasChildren(item: MenuItem) {
  return Array.isArray(item.children) && item.children.length > 0
}

export function AppSidebar({
  variant,
  menuGroups,
  activeSectionId,
  expandedMenus,
  onSelectSection,
  onToggleExpanded,
  onOpenConsole,
  onRequestClose,
  className,
}: AppSidebarProps) {
  const containerClassName =
    variant === 'desktop'
      ? 'hidden lg:flex w-[264px] shrink-0 flex-col bg-background text-foreground border-r border-border'
      : 'w-full flex flex-col bg-background text-foreground'

  function renderItem(item: MenuItem, depth: number) {
    const active = item.sectionId && activeSectionId === item.sectionId
    const children = hasChildren(item)
    const expanded = children ? expandedMenus.has(item.id) : false
    const indentClassName = depth > 0 ? 'ml-8' : ''

    return (
      <div key={item.id} className={cn(indentClassName)}>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 px-3 py-2 h-auto rounded-xl text-left',
            active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          onClick={() => {
            if (children) {
              onToggleExpanded(item.id)
              return
            }
            if (item.action === 'console') {
              onOpenConsole()
              onRequestClose?.()
              return
            }
            if (item.sectionId) {
              onSelectSection(item.sectionId)
              onRequestClose?.()
            }
          }}
        >
          <i className={cn('iconfont', item.icon || 'icon-daohang2', 'text-[18px] leading-none')} aria-hidden="true" />
          <span className="text-sm font-medium truncate">{item.label}</span>
          {children ? <span className={cn('ml-auto transition opacity-70', expanded ? 'rotate-180' : '')}>▾</span> : null}
        </Button>
        {children ? (
          <div className={cn('ml-8 pl-3 border-l border-border space-y-1', expanded ? 'mt-1' : 'hidden')}>
            {item.children!.map((child) => renderItem(child, depth + 1))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <aside className={cn(containerClassName, className)} aria-label="侧边栏">
      <div className="h-14 px-5 flex items-center gap-3 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-brand-600/95 flex items-center justify-center font-semibold text-white">K</div>
        <div className="font-semibold tracking-wide">NavSphere导航</div>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-auto" aria-label="导航">
        <div className="space-y-5">
          {menuGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <div className="px-3 text-xs text-muted-foreground">{group.label}</div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.id}>{renderItem(item, 0)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
      {variant === 'desktop' ? (
        <div className="px-5 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">LuckyStunWeb</div>
            <div className="text-xs text-muted-foreground">UI V1</div>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

