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
    const tryImage = (url: string, ms = 3000) =>
      new Promise<{ ok: boolean; elapsedMs: number }>((resolve) => {
        const img = new Image()
        let done = false
        const startedAt = performance.now()
        const t = setTimeout(() => {
          if (done) return
          done = true
          img.onload = null
          img.onerror = null
          resolve({ ok: false, elapsedMs: Math.round(performance.now() - startedAt) })
        }, ms)
        const finish = (ok: boolean) => {
          if (done) return
          done = true
          clearTimeout(t)
          img.onload = null
          img.onerror = null
          resolve({ ok, elapsedMs: Math.round(performance.now() - startedAt) })
        }
        img.onload = () => finish(true)
        img.onerror = () => finish(false)
        const sep = url.includes('?') ? '&' : '?'
        img.src = `${url}${sep}ts=${Date.now()}`
      })
    const tryFetch = async (url: string, ms = 3000, mode: RequestMode = 'cors') => {
      const startedAt = performance.now()
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), ms)
      try {
        const res = await fetch(url, { mode, cache: 'no-store', signal: c.signal })
        const contentType = res.headers.get('content-type') || ''
        let bodySnippet = ''
        if (contentType.includes('json') || contentType.startsWith('text/')) {
          const text = await res.text()
          bodySnippet = text.slice(0, 200)
        }
        return {
          ok: res.ok,
          status: res.status,
          type: res.type,
          elapsedMs: Math.round(performance.now() - startedAt),
          bodySnippet,
        }
      } catch (e) {
        return {
          ok: false,
          status: 0,
          type: 'error',
          elapsedMs: Math.round(performance.now() - startedAt),
          error: e instanceof Error ? e.message : String(e),
        }
      } finally {
        clearTimeout(t)
      }
    }
    const detect = async () => {
      const probeUrl = 'http://192.168.31.3/favicon.ico'
      const imageProbe = await tryImage(probeUrl)
      let ok = imageProbe.ok
      const probes: Array<Record<string, unknown>> = [
        {
          url: probeUrl,
          kind: 'image',
          ok: imageProbe.ok,
          elapsedMs: imageProbe.elapsedMs,
        },
      ]
      if (!ok) {
        const fetchProbe = await tryFetch(probeUrl, 3000, 'cors')
        probes.push({
          url: probeUrl,
          kind: 'fetch',
          mode: 'cors',
          ...fetchProbe,
        })
        if (!fetchProbe.ok) {
          const opaqueProbe = await tryFetch(probeUrl, 3000, 'no-cors')
          probes.push({
            url: probeUrl,
            kind: 'fetch',
            mode: 'no-cors',
            ...opaqueProbe,
          })
          ok = opaqueProbe.ok
        } else {
          ok = true
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
