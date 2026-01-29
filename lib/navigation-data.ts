import { fetchJson } from '@/lib/http'
import { transformApiData, type ApiCategoryNode } from './navigation-utils'
import type { MenuGroup, Section } from '@/data/navigation/types'

export type NavigationData = {
  sections: Section[]
  menuGroups: MenuGroup[]
}

export async function fetchNavigationDataFromApi(baseUrl = ''): Promise<NavigationData> {
  const url = `${baseUrl}/api/navigation`
  const tree = await fetchJson<ApiCategoryNode[]>(url, { cache: 'no-store' })
  return transformApiData(tree)
}
