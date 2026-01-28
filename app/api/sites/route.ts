import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'

type SiteBody = {
  category_id?: number
  url?: string
  backup_url?: string
  internal_url?: string
  logo?: string
  title?: string
  desc?: string
  sort_order?: number
  is_visible?: boolean | number
  update_port_enabled?: boolean | number
}

function isValidUrl(value?: string) {
  if (!value) return true
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const results = await query(
    'SELECT id, category_id, url, backup_url, internal_url, logo, title, "desc", sort_order, is_visible, created_at, update_port_enabled FROM sites ORDER BY sort_order ASC, id ASC'
  )
  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const { data, error } = await readJson<SiteBody>(req)
  if (error) return error
  const categoryId = Number(data?.category_id)
  if (!Number.isInteger(categoryId) || categoryId <= 0 || !data?.url || !data?.title) {
    return NextResponse.json({ message: '请提供必要的网站信息' }, { status: 400 })
  }
  if (!isValidUrl(data.url) || !isValidUrl(data.backup_url) || !isValidUrl(data.internal_url)) {
    return NextResponse.json({ message: 'URL格式不正确' }, { status: 400 })
  }
  let sortOrder = data.sort_order
  if (sortOrder === undefined || sortOrder === null || !Number.isFinite(Number(sortOrder))) {
    const maxResult = await query(
      'SELECT MAX(sort_order) as max_sort FROM sites WHERE category_id = $1',
      [categoryId]
    )
    sortOrder = (maxResult[0]?.max_sort ?? -1) + 1
  } else {
    sortOrder = Number(sortOrder)
  }
  const isVisible = data.is_visible === undefined ? true : Boolean(data.is_visible)
  const updatePortEnabled = data.update_port_enabled === undefined ? true : Boolean(data.update_port_enabled)
  const result = await execute(
    'INSERT INTO sites (category_id, url, backup_url, internal_url, logo, title, "desc", sort_order, is_visible, update_port_enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id'
    ,
    [
      categoryId,
      data.url,
      data.backup_url || null,
      data.internal_url || null,
      data.logo || null,
      data.title,
      data.desc || null,
      sortOrder,
      isVisible,
      updatePortEnabled,
    ]
  )
  return NextResponse.json({ id: result.rows[0]?.id, message: '网站添加成功' }, { status: 201 })
}
