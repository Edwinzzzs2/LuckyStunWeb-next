import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'

type CategoryBody = {
  name?: string
  en_name?: string
  icon?: string
  parent_id?: number | string | null
  sort_order?: number
}

export async function GET() {
  const rows = await query(
    'SELECT id, name, en_name, icon, parent_id, sort_order, created_at FROM categories ORDER BY parent_id ASC, sort_order ASC, id ASC'
  )
  const map = new Map<number, any>()
  const tree: any[] = []
  rows.forEach((item) => {
    map.set(item.id, { ...item, children: [] })
  })
  rows.forEach((item) => {
    const node = map.get(item.id)
    if (item.parent_id && map.get(item.parent_id)) {
      map.get(item.parent_id).children.push(node)
    } else {
      tree.push(node)
    }
  })
  return NextResponse.json(tree)
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const { data, error } = await readJson<CategoryBody>(req)
  if (error) return error
  const name = data?.name?.trim()
  if (!name) return NextResponse.json({ message: '分类名称不能为空' }, { status: 400 })
  const parentValue = data?.parent_id
  const parentId = parentValue && parentValue !== '0' ? Number(parentValue) : null
  const sortOrder = Number.isFinite(data?.sort_order) ? Number(data?.sort_order) : 0
  const result = await execute(
    'INSERT INTO categories (name, en_name, icon, parent_id, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id'
    ,
    [name, data?.en_name || null, data?.icon || null, parentId, sortOrder]
  )
  return NextResponse.json(
    { id: result.rows[0]?.id, name, en_name: data?.en_name, icon: data?.icon, parent_id: parentId, sort_order: sortOrder },
    { status: 201 }
  )
}
