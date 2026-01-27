"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Site } from '@/data/navigation/types'
import { SITE_ICON_PLACEHOLDER } from '@/data/navigation/mock'
import { normalizeUrl } from '@/lib/utils'
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
    if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggleTheme() {
    const effective = resolvedTheme === 'dark' ? 'dark' : 'light'
    setTheme(effective === 'dark' ? 'light' : 'dark')
  }

  function openConsole() {
    const next = '/console'
    window.open(next, '_blank', 'noopener,noreferrer')
  }

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

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
        />
      </NavigationShell>

      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0" aria-label="移动端侧边栏">
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
