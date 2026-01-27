export type Site = {
  title: string
  desc?: string
  logo?: string
  url?: string
  backup_url?: string
  internal_url?: string
}

export type Section = {
  id: string
  name: string
  icon?: string
  sites: Site[]
}

export type MenuItem = {
  id: string
  label: string
  icon?: string
  sectionId?: string
  action?: 'console'
  children?: MenuItem[]
}

export type MenuGroup = {
  label: string
  items: MenuItem[]
}

