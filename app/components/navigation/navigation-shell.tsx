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
    <div className="fixed inset-0 w-full overflow-hidden bg-background">
      <div className="flex h-full w-full">
        {sidebarCollapsed ? null : sidebar}
        <div className={cn('flex min-w-0 flex-1 flex-col h-full', sidebarCollapsed ? 'w-full' : '')}>
          {header}
          <div className="min-h-0 flex-1 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
