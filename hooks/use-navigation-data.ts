"use client"

import { useEffect, useMemo, useState } from 'react'

import type { MenuGroup, Section } from '@/data/navigation/types'
import { demoMenuGroups, demoSections } from '@/data/navigation/mock'
import { fetchNavigationDataFromApi } from '@/lib/navigation-data'

type DataSource = 'api' | 'mock'

type NavigationDataState = {
  sections: Section[]
  menuGroups: MenuGroup[]
  source: DataSource
  isLoading: boolean
  error?: string
}

function getDefaultSource(): DataSource {
  const fromEnv = process.env.NEXT_PUBLIC_NAV_DATA_SOURCE
  return fromEnv === 'mock' ? 'mock' : 'api'
}

function getSourceFromRuntime(): DataSource | null {
  try {
    const url = new URL(window.location.href)
    const q = url.searchParams.get('source')
    if (q === 'mock' || q === 'api') return q
    const stored = localStorage.getItem('nav_data_source')
    if (stored === 'mock' || stored === 'api') return stored
  } catch {
    return null
  }
  return null
}

export function useNavigationData() {
  const [state, setState] = useState<NavigationDataState>(() => ({
    sections: demoSections,
    menuGroups: demoMenuGroups,
    source: getDefaultSource(),
    isLoading: getDefaultSource() === 'api',
  }))

  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || '', [])

  useEffect(() => {
    const runtime = getSourceFromRuntime()
    if (!runtime) return
    setState((prev) => ({
      ...prev,
      source: runtime,
      isLoading: runtime === 'api',
    }))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (state.source === 'mock') {
        setState((prev) => ({ ...prev, sections: demoSections, menuGroups: demoMenuGroups, isLoading: false, error: undefined }))
        return
      }

      setState((prev) => ({ ...prev, isLoading: true, error: undefined }))
      try {
        const data = await fetchNavigationDataFromApi(apiBaseUrl)
        if (cancelled) return
        setState((prev) => ({ ...prev, sections: data.sections, menuGroups: data.menuGroups, isLoading: false, error: undefined }))
      } catch (e: any) {
        if (cancelled) return
        const message = typeof e?.message === 'string' ? e.message : '加载导航数据失败'
        setState((prev) => ({ ...prev, sections: demoSections, menuGroups: demoMenuGroups, source: 'mock', isLoading: false, error: message }))
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, state.source])

  return state
}

