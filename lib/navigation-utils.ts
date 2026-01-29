import type { MenuGroup, Section, Site, MenuItem } from '@/data/navigation/types'

export type ApiCategoryNode = {
  id: number
  name: string
  en_name?: string
  icon?: string
  parent_id?: number
  sort_order: number
  children: ApiCategoryNode[]
  web: any[]
}

export function transformApiData(tree: ApiCategoryNode[]): { sections: Section[]; menuGroups: MenuGroup[] } {
  const sections: Section[] = []

  const transformSites = (sites: any[]): Site[] => {
    return sites.map((s) => ({
      title: s.title,
      desc: s.desc,
      logo: s.logo,
      url: s.url,
      backup_url: s.backup_url,
      internal_url: s.internal_url,
    }))
  }

  const processNode = (node: ApiCategoryNode): MenuItem => {
    const hasSites = node.web && node.web.length > 0
    const hasChildren = node.children && node.children.length > 0
    const sectionId = String(node.id)

    if (hasSites) {
      sections.push({
        id: sectionId,
        name: node.name,
        icon: node.icon,
        sites: transformSites(node.web),
      })
    }

    const menuItem: MenuItem = {
      id: sectionId,
      label: node.name,
      icon: node.icon,
    }

    if (hasSites) {
      menuItem.sectionId = sectionId
    }

    if (hasChildren) {
      menuItem.children = node.children.map(processNode)
    }

    return menuItem
  }

  const menuItems = tree.map(processNode)

  // 这里简单地将所有顶层分类放入一个"导航"组
  // 如果需要更复杂的逻辑（比如根据分类名称分组），可以在这里调整
  const menuGroups: MenuGroup[] = [
    {
      label: '导航',
      items: menuItems,
    },
  ]

  return { sections, menuGroups }
}
