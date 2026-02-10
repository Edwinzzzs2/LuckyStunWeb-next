"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

export type NetworkType = 'main' | 'backup' | 'internal'

type Preferences = {
  network: NetworkType
  sidebarCollapsed: boolean
  expandedMenuIds: string[]
}

const defaultPreferences: Preferences = {
  network: 'main',
  sidebarCollapsed: false,
  expandedMenuIds: [],
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
    let timer: any
    const tryFetch = async (url: string, ms = 2500) => {
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), ms)
      try {
        await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: c.signal })
        return true
      } catch {
        return false
      } finally {
        clearTimeout(t)
      }
    }
    const detect = async () => {
      const ok = (await tryFetch('http://192.168.31.3')) || (await tryFetch('https://192.168.31.3'))
      if (ok) {
        setNetwork((prev) => (prev === 'backup' ? prev : 'internal'))
        if (localStorage.getItem('ui_network') !== 'backup') localStorage.setItem('ui_network', 'internal')
      } else {
        setNetwork((prev) => (prev === 'backup' ? prev : 'main'))
        if (localStorage.getItem('ui_network') !== 'backup') localStorage.setItem('ui_network', 'main')
      }
    }
    detect()
    timer = setInterval(detect, 30000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [])

  const setNetworkType = useCallback((type: NetworkType) => {
    setNetwork(type)
    localStorage.setItem('ui_network', type)
  }, [])

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => !prev)
  }, [])

  const toggleExpandedMenu = useCallback((id: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
