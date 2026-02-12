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
    const detect = async () => {
      const controller = new AbortController()
      const startedAt = performance.now()
      const t = setTimeout(() => controller.abort(), 4000)
      let ok = false
      let clientIp = ''
      let luckyIp = ''
      let luckyPort = ''
      let probe: Record<string, unknown> = { url: '/api/network/resolve' }
      try {
        const res = await fetch('/api/network/resolve', { cache: 'no-store', signal: controller.signal })
        const text = await res.text()
        let data: any = null
        try {
          data = JSON.parse(text)
        } catch {
          data = null
        }
        ok = Boolean(data?.isInternal)
        clientIp = String(data?.clientIp || '')
        luckyIp = String(data?.luckyIp || '')
        luckyPort = String(data?.luckyPort || '')
        probe = {
          url: '/api/network/resolve',
          status: res.status,
          ok: res.ok,
          elapsedMs: Math.round(performance.now() - startedAt),
          bodySnippet: text.slice(0, 200),
        }
      } catch (e: any) {
        probe = {
          url: '/api/network/resolve',
          status: 0,
          ok: false,
          elapsedMs: Math.round(performance.now() - startedAt),
          error: e?.message || 'unknown',
        }
      } finally {
        clearTimeout(t)
      }
      const probes = [probe]

      const target: NetworkType = ok ? 'internal' : 'main'
      const stored = localStorage.getItem('ui_network') as NetworkType | null
      const postLog = async (meta: Record<string, unknown>) => {
        try {
          await fetch('/api/webhook/logs', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              source: 'network',
              level: 'info',
              message: '网络自动切换检测',
              meta,
            }),
          })
        } catch {}
      }
      setNetwork((prev) => {
        const applied = prev === 'backup' ? 'backup' : target
        const action = prev === 'backup' ? 'keep-backup' : prev === target ? 'stay' : 'switch'
        const persisted = stored !== 'backup'
        const persistedChanged = persisted && stored !== target
        if (prev === 'backup') console.info('[network] keep backup', { ok, prev, target })
        else if (prev !== target) console.info('[network] switch', { ok, from: prev, to: target })
        else console.info('[network] stay', { ok, network: prev })
        void postLog({
          ok,
          prev,
          target,
          applied,
          stored,
          action,
          persisted,
          persistedChanged,
          probes,
          clientIp,
          luckyIp,
          luckyPort,
        })
        return applied
      })
      if (stored !== 'backup') {
        if (stored !== target) console.info('[network] persist', { from: stored, to: target })
        localStorage.setItem('ui_network', target)
      } else {
        console.info('[network] persist skipped', { stored: 'backup', target })
      }
    }
    detect()
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
