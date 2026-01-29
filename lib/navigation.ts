import { query } from '@/lib/db'
import { transformApiData } from './navigation-utils'
import { demoSections, demoMenuGroups } from '@/data/navigation/mock'

export async function getNavigationTree() {
  const categories = await query(
    'SELECT id, name, en_name, icon, parent_id, sort_order FROM categories ORDER BY parent_id ASC, sort_order ASC, id ASC'
  )
  const sites = await query(
    'SELECT id, category_id, url, backup_url, internal_url, logo, title, "desc", sort_order FROM sites WHERE is_visible = TRUE ORDER BY category_id ASC, sort_order ASC, id ASC'
  )
  const map = new Map<number, any>()
  const roots: any[] = []
  categories.forEach((item) => {
    map.set(item.id, { ...item, children: [] })
  })
  categories.forEach((item) => {
    const node = map.get(item.id)
    if (item.parent_id === null) {
      roots.push(node)
    } else {
      const parent = map.get(item.parent_id)
      if (parent) parent.children.push(node)
    }
  })
  const siteMap = new Map<number, any[]>()
  sites.forEach((site) => {
    const list = siteMap.get(site.category_id) || []
    list.push(site)
    siteMap.set(site.category_id, list)
  })
  const attachSites = (nodes: any[]) => {
    nodes.forEach((node) => {
      node.web = siteMap.get(node.id) || []
      if (node.children.length > 0) attachSites(node.children)
    })
  }
  attachSites(roots)
  return roots
}

export async function getNavigationData() {
  if (process.env.NEXT_PUBLIC_NAV_DATA_SOURCE === 'mock') {
    return {
      sections: demoSections,
      menuGroups: demoMenuGroups,
    }
  }

  const tree = await getNavigationTree()
  return transformApiData(tree)
}
