"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

export type NetworkType = 'main' | 'backup' | 'internal'

type Preferences = {
  network: NetworkType
  sidebarCollapsed: boolean
  expandedMenuIds: string[]
}

const defaultPreferences: Preferences = {
  network: 'internal',
  sidebarCollapsed: false,
  expandedMenuIds: [],
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function useNavigationPreferences() {
  const [network, setNetwork] = useState<NetworkType>(defaultPreferences.network)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(defaultPreferences.sidebarCollapsed)
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set())

  useEffect(() => {
    const storedNetwork = localStorage.getItem('ui_network') as NetworkType | null
    if (storedNetwork === 'main' || storedNetwork === 'backup' || storedNetwork === 'internal') {
      setNetwork(storedNetwork)
    }
    setSidebarCollapsed(localStorage.getItem('ui_sidebar') === 'collapsed')

    const storedExpanded = readJson<string[]>('ui_menu_expanded')
    if (Array.isArray(storedExpanded)) setExpandedMenus(new Set(storedExpanded))
  }, [])

  const setNetworkType = useCallback((type: NetworkType) => {
    setNetwork(type)
    localStorage.setItem('ui_network', type)
  }, [])

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('ui_sidebar', next ? 'collapsed' : 'expanded')
      return next
    })
  }, [])

  const toggleExpandedMenu = useCallback((id: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem('ui_menu_expanded', JSON.stringify(Array.from(next)))
      return next
    })
  }, [])

  const expandedMenuIds = useMemo(() => Array.from(expandedMenus), [expandedMenus])

  return {
    network,
    setNetworkType,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    expandedMenus,
    expandedMenuIds,
    toggleExpandedMenu,
    setExpandedMenus,
  }
}

