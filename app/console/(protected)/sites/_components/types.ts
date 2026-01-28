export type CategoryFlat = { id: number; name: string }

export type SiteRow = {
  id: number
  category_id: number
  url: string
  backup_url: string | null
  internal_url: string | null
  logo: string | null
  title: string
  desc: string | null
  sort_order: number | null
  is_visible: boolean
  update_port_enabled: boolean
}

export type SiteFormState = {
  category_id: string
  logo: string
  title: string
  desc: string
  url: string
  backup_url: string
  internal_url: string
  sort_order: string
  is_visible: boolean
  update_port_enabled: boolean
}

export type TableColKey = 'select' | 'logo' | 'id' | 'info' | 'links' | 'actions'

export function toForm(site?: SiteRow, defaultCategoryId?: number): SiteFormState {
  return {
    category_id: site ? String(site.category_id) : String(defaultCategoryId || 0),
    logo: site?.logo || '',
    title: site?.title || '',
    desc: site?.desc || '',
    url: site?.url || '',
    backup_url: site?.backup_url || '',
    internal_url: site?.internal_url || '',
    sort_order: site?.sort_order === null || site?.sort_order === undefined ? '' : String(site.sort_order),
    is_visible: site?.is_visible ?? true,
    update_port_enabled: site?.update_port_enabled ?? true,
  }
}

