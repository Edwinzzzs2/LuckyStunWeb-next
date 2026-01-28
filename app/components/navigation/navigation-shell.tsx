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
    <div className="h-screen overflow-hidden">
      <div className="h-full mx-auto w-full max-w-[1680px]">
        <div className="flex h-full px-2 2xl:px-8">
          {sidebarCollapsed ? null : sidebar}
          <div className={cn('flex-1 min-w-0 flex flex-col h-full', sidebarCollapsed ? 'w-full' : '')}>
            {header}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
