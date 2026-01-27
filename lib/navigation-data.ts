import type { MenuGroup, MenuItem, Section, Site } from '@/data/navigation/types'

import { fetchJson } from '@/lib/http'

export type NavigationData = {
  sections: Section[]
  menuGroups: MenuGroup[]
}

type ApiSite = {
  id: number
  url: string
  backup_url: string | null
  internal_url: string | null
  logo: string | null
  title: string
  desc: string | null
}

type ApiCategoryNode = {
  id: number
  name: string
  icon?: string | null
  parent_id?: number | null
  sort_order?: number
  children: ApiCategoryNode[]
  web: ApiSite[]
}

function categorySectionId(categoryId: number) {
  return `cat-${categoryId}`
}

function toSite(site: ApiSite): Site {
  return {
    title: site.title,
    desc: site.desc ?? undefined,
    logo: site.logo ?? undefined,
    url: site.url ?? undefined,
    backup_url: site.backup_url ?? undefined,
    internal_url: site.internal_url ?? undefined,
  }
}

function flattenSections(nodes: ApiCategoryNode[], list: Section[]) {
  nodes.forEach((node) => {
    list.push({
      id: categorySectionId(node.id),
      name: node.name,
      icon: node.icon ?? undefined,
      sites: Array.isArray(node.web) ? node.web.map(toSite) : [],
    })
    if (Array.isArray(node.children) && node.children.length > 0) flattenSections(node.children, list)
  })
}

function buildMenuItem(node: ApiCategoryNode): MenuItem {
  const children = Array.isArray(node.children) ? node.children : []
  const menuItem: MenuItem = {
    id: categorySectionId(node.id),
    label: node.name,
    icon: node.icon ?? undefined,
    sectionId: categorySectionId(node.id),
  }
  if (children.length > 0) {
    menuItem.children = children.map(buildMenuItem)
  }
  return menuItem
}

export async function fetchNavigationDataFromApi(baseUrl = ''): Promise<NavigationData> {
  const url = `${baseUrl}/api/navigation`
  const tree = await fetchJson<ApiCategoryNode[]>(url, { cache: 'no-store' })

  const sections: Section[] = []
  flattenSections(tree, sections)

  const menuGroups: MenuGroup[] = [
    {
      label: '导航',
      items: tree.map(buildMenuItem),
    },
    {
      label: '系统',
      items: [{ id: 'console', label: '进入控制台', icon: 'icon-tuchuangguanli', action: 'console' }],
    },
  ]

  return { sections, menuGroups }
}

