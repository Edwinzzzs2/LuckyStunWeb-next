import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'
import { logger } from '@/lib/logger'

type CategoryBody = {
  name?: string
  en_name?: string
  icon?: string
  parent_id?: number | string | null
  sort_order?: number
}

export async function GET() {
  logger.info('[Categories GET] Request received')
  try {
    const rows = await query(
      'SELECT id, name, en_name, icon, parent_id, sort_order, created_at FROM categories ORDER BY parent_id ASC, sort_order ASC, id ASC'
    )
    logger.info(`[Categories GET] Fetched ${rows.length} categories`)
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
  } catch (e: any) {
    logger.error('[Categories GET] Database error:', e)
    return NextResponse.json({ message: '获取分类失败' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  logger.info('[Categories POST] Request received')
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Categories POST] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Categories POST] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }
  const { data, error } = await readJson<CategoryBody>(req)
  if (error) {
    logger.error('[Categories POST] JSON parse error:', error)
    return error
  }
  
  const name = data?.name?.trim()
  logger.info(`[Categories POST] Creating category: ${name}`)
  
  if (!name) {
    logger.warn('[Categories POST] Missing category name')
    return NextResponse.json({ message: '分类名称不能为空' }, { status: 400 })
  }
  const parentValue = data?.parent_id
  const parentId = parentValue && parentValue !== '0' ? Number(parentValue) : null
  let sortOrder = data?.sort_order
  
  try {
    if (sortOrder === undefined || sortOrder === null || !Number.isFinite(Number(sortOrder))) {
      const maxResult = await query(
        'SELECT MAX(sort_order) as max_sort FROM categories WHERE parent_id IS NOT DISTINCT FROM $1',
        [parentId]
      )
      sortOrder = (maxResult[0]?.max_sort ?? -1) + 1
    } else {
      sortOrder = Number(sortOrder)
    }
    const result = await execute(
      'INSERT INTO categories (name, en_name, icon, parent_id, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING id'
      ,
      [name, data?.en_name || null, data?.icon || null, parentId, sortOrder]
    )
    logger.info(`[Categories POST] Category created successfully, ID: ${result.rows[0]?.id}`)
    return NextResponse.json(
      { id: result.rows[0]?.id, name, en_name: data?.en_name, icon: data?.icon, parent_id: parentId, sort_order: sortOrder },
      { status: 201 }
    )
  } catch (e: any) {
    logger.error('[Categories POST] Database error:', e)
    return NextResponse.json({ message: '创建分类失败' }, { status: 500 })
  }
}
