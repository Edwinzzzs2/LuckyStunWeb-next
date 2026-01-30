import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type NavigationShellProps = {
  sidebar?: ReactNode
  header: ReactNode
  children: ReactNode
  sidebarCollapsed?: boolean
}

export function NavigationShell({ sidebar, header, children, sidebarCollapsed }: NavigationShellProps) {
  return (
    <div className="fixed inset-0 flex w-full flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        {sidebarCollapsed ? null : sidebar}
        <div className={cn('flex min-w-0 flex-1 flex-col min-h-0', sidebarCollapsed ? 'w-full' : '')}>
          {header}
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  )
}
