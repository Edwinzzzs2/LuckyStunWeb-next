"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { Site } from '@/data/navigation/types'
import { SITE_ICON_PLACEHOLDER } from '@/data/navigation/mock'
import { normalizeUrl } from '@/lib/utils'
import type { MenuGroup } from '@/data/navigation/types'
import { NavigationShell } from '@/app/components/navigation/navigation-shell'
import { AppSidebar } from '@/app/components/navigation/app-sidebar'
import { AppHeader } from '@/app/components/navigation/app-header'
import { NavigationContent } from '@/app/components/navigation/navigation-content'
import { useNavigationPreferences, type NetworkType } from '@/hooks/use-navigation-preferences'
import { useHotkeys } from '@/hooks/use-hotkeys'
import { useNavigationData } from '@/hooks/use-navigation-data'

export default function Page() {
  const { sections, menuGroups } = useNavigationData()
  const { network, setNetworkType, sidebarCollapsed, toggleSidebarCollapsed, expandedMenus, toggleExpandedMenu } =
    useNavigationPreferences()
  const [search, setSearch] = useState('')
  const [activeSectionId, setActiveSectionId] = useState<string>('')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const contentScrollRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    if (sections.length === 0) return
    setActiveSectionId((prev) => {
      if (prev && sections.some((s) => s.id === prev)) return prev
      return sections[0]!.id
    })
  }, [sections])

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sections
    return sections
      .map((sec) => ({ ...sec, sites: sec.sites.filter((s) => `${s.title || ''} ${s.desc || ''}`.toLowerCase().includes(q)) }))
      .filter((sec) => sec.sites.length > 0)
  }, [search, sections])

  const sectionDepths = useMemo(() => {
    const map: Record<string, number> = {}
    function walk(items: MenuGroup['items'], depth: number) {
      for (const it of items) {
        if (it.sectionId) map[it.sectionId] = Math.max(depth, map[it.sectionId] ?? 0)
        if (Array.isArray(it.children) && it.children.length) walk(it.children, depth + 1)
      }
    }
    for (const g of menuGroups) walk(g.items, 0)
    return map
  }, [menuGroups])

  function resolveTargetUrl(site: Site, n: NetworkType) {
    const main = normalizeUrl(site.url)
    const backup = normalizeUrl(site.backup_url)
    const internal = normalizeUrl(site.internal_url)
    if (n === 'backup' && backup) return backup
    if (n === 'internal' && internal) return internal
    return main
  }

  function scrollToSection(id: string) {
    setActiveSectionId(id)

    const anchor = document.getElementById(`sec-${id}`)
    const container = contentScrollRef.current

    const run = () => {
      const header = document.querySelector('header') as HTMLElement | null
      const headerOffset = header?.offsetHeight ?? 56
      const extraOffset = 12
      if (!anchor || !container) {
        if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }

      const containerRect = container.getBoundingClientRect()
      const anchorRect = anchor.getBoundingClientRect()
      const nextTop = anchorRect.top - containerRect.top + container.scrollTop - headerOffset - extraOffset
      container.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })
    }

    const shouldDelay = mobileSidebarOpen
    if (shouldDelay) setMobileSidebarOpen(false)
    if (shouldDelay) requestAnimationFrame(() => requestAnimationFrame(run))
    else run()
  }

  function toggleTheme() {
    const effective = resolvedTheme === 'dark' ? 'dark' : 'light'
    setTheme(effective === 'dark' ? 'light' : 'dark')
  }

  function openConsole() {
    const next = '/console'
    window.open(next, '_blank', 'noopener,noreferrer')
  }

  useHotkeys({
    onCommandK: () => {
      const input = searchInputRef.current
      input?.focus()
      input?.select()
    },
    onEscape: () => {
      setMobileSidebarOpen(false)
      searchInputRef.current?.blur()
    },
  })

  return (
    <>
      <NavigationShell
        sidebarCollapsed={sidebarCollapsed}
        sidebar={
          <AppSidebar
            variant="desktop"
            menuGroups={menuGroups}
            activeSectionId={activeSectionId}
            expandedMenus={expandedMenus}
            onSelectSection={scrollToSection}
            onToggleExpanded={toggleExpandedMenu}
            onOpenConsole={openConsole}
          />
        }
        header={
          <AppHeader
            search={search}
            onSearchChange={setSearch}
            searchInputRef={searchInputRef}
            network={network}
            onNetworkChange={(type) => setNetworkType(type)}
            resolvedTheme={resolvedTheme}
            onToggleTheme={toggleTheme}
            onToggleSidebar={toggleSidebarCollapsed}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          />
        }
      >
        <NavigationContent
          sections={filteredSections}
          network={network}
          contentScrollRef={contentScrollRef}
          resolveTargetUrl={resolveTargetUrl}
          placeholderLogoUrl={SITE_ICON_PLACEHOLDER}
          sectionDepths={sectionDepths}
        />
      </NavigationShell>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0" aria-label="移动端侧边栏">
          <SheetHeader className="sr-only">
            <SheetTitle>菜单</SheetTitle>
          </SheetHeader>
          <AppSidebar
            variant="mobile"
            menuGroups={menuGroups}
            activeSectionId={activeSectionId}
            expandedMenus={expandedMenus}
            onSelectSection={scrollToSection}
            onToggleExpanded={toggleExpandedMenu}
            onOpenConsole={openConsole}
            onRequestClose={() => setMobileSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
