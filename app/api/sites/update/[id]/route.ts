import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'

type Body = {
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

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const siteId = Number(params.id)
  if (!Number.isInteger(siteId)) {
    return NextResponse.json({ message: '无效的网站 ID' }, { status: 400 })
  }
  const { data, error } = await readJson<Body>(req)
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
    'UPDATE sites SET category_id = $1, url = $2, backup_url = $3, internal_url = $4, logo = $5, title = $6, "desc" = $7, sort_order = $8, is_visible = $9, update_port_enabled = $10 WHERE id = $11'
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
      siteId,
    ]
  )
  if (result.rowCount === 0) {
    return NextResponse.json({ message: '未找到要更新的网站' }, { status: 404 })
  }
  return NextResponse.json({ message: '网站更新成功' })
}
