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
    const tryImage = (url: string, ms = 2500) =>
      new Promise<boolean>((resolve) => {
        const img = new Image()
        let done = false
        const t = setTimeout(() => {
          if (done) return
          done = true
          img.onload = null
          img.onerror = null
          resolve(false)
        }, ms)
        const finish = (ok: boolean) => {
          if (done) return
          done = true
          clearTimeout(t)
          img.onload = null
          img.onerror = null
          resolve(ok)
        }
        img.onload = () => finish(true)
        img.onerror = () => finish(false)
        const sep = url.includes('?') ? '&' : '?'
        img.src = `${url}${sep}ts=${Date.now()}`
      })
    const detect = async () => {
      const isSecure = window.location.protocol === 'https:'
      const targetUrl = isSecure ? 'https://192.168.31.3' : 'http://192.168.31.3'
      const probeUrl = `${targetUrl}/favicon.ico`
      
      let ok = await tryImage(probeUrl)
      const probes = [probeUrl]

      // HTTPS 场景下，如果证书无效导致探测失败，尝试降级到 HTTP (Mixed Content)
      if (!ok && isSecure) {
        const fallbackUrl = 'http://192.168.31.3/favicon.ico'
        const fallbackOk = await tryImage(fallbackUrl)
        if (fallbackOk) {
          ok = true
          probes.push(fallbackUrl)
        }
      }

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
          isSecure,
          probes,
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
