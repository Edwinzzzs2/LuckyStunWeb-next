"use client"

import { useEffect, useState } from 'react'
import type { MenuGroup, Section } from '@/data/navigation/types'
import { demoMenuGroups, demoSections } from '@/data/navigation/mock'

type DataSource = 'api' | 'mock'

type NavigationDataState = {
  sections: Section[]
  menuGroups: MenuGroup[]
  source: DataSource
  isLoading: boolean
  error?: string
}

/**
 * 获取导航数据的 Hook
 * 现在的逻辑极其简化：优先使用 SSR 传入的 initialData。
 * 不再在客户端进行二次 Fetch 或复杂的 Source 切换比对，从而彻底杜绝刷新闪烁。
 */
export function useNavigationData(initialData?: { sections: Section[]; menuGroups: MenuGroup[] }) {
  const [state, setState] = useState<NavigationDataState>(() => {
    const isMockMode = process.env.NEXT_PUBLIC_NAV_DATA_SOURCE === 'mock'

    if (initialData) {
      return {
        sections: initialData.sections,
        menuGroups: initialData.menuGroups,
        source: isMockMode ? 'mock' : 'api',
        isLoading: false,
      }
    }

    // 兜底逻辑：如果没有 initialData，则根据环境返回数据
    return {
      sections: isMockMode ? demoSections : [],
      menuGroups: isMockMode ? demoMenuGroups : [],
      source: isMockMode ? 'mock' : 'api',
      isLoading: false,
    }
  })

  useEffect(() => {
    if (!initialData) return
    const isMockMode = process.env.NEXT_PUBLIC_NAV_DATA_SOURCE === 'mock'
    setState({
      sections: initialData.sections,
      menuGroups: initialData.menuGroups,
      source: isMockMode ? 'mock' : 'api',
      isLoading: false,
    })
  }, [initialData])

  return state
}
