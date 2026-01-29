import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'
import { logger } from '@/lib/logger'

type Body = { name?: string; en_name?: string; icon?: string; parent_id?: number | string | null; sort_order?: number }

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  logger.info(`[Category Update] Request received for ID: ${params.id}`)
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Category Update] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Category Update] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }
  const categoryId = Number(params.id)
  if (!Number.isInteger(categoryId)) {
    logger.warn(`[Category Update] Invalid ID: ${params.id}`)
    return NextResponse.json({ message: '无效的分类 ID' }, { status: 400 })
  }
  const { data, error } = await readJson<Body>(req)
  if (error) {
    logger.error('[Category Update] JSON parse error:', error)
    return error
  }
  
  const name = data?.name?.trim()
  logger.info(`[Category Update] Updating category ${categoryId}, new name: ${name}`)
  
  if (!name) {
    logger.warn('[Category Update] Missing name')
    return NextResponse.json({ message: '分类名称不能为空' }, { status: 400 })
  }
  const parentValue = data?.parent_id
  const parentId = parentValue && parentValue !== '0' ? Number(parentValue) : null
  if (parentId === categoryId) {
    logger.warn('[Category Update] Parent cannot be self')
    return NextResponse.json({ message: '不能将分类的父级设置为自身' }, { status: 400 })
  }
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
      'UPDATE categories SET name = $1, en_name = $2, icon = $3, parent_id = $4, sort_order = $5 WHERE id = $6'
      ,
      [name, data?.en_name || null, data?.icon || null, parentId, sortOrder, categoryId]
    )
    if (result.rowCount === 0) {
      logger.warn(`[Category Update] Category not found: ${categoryId}`)
      return NextResponse.json({ message: '未找到要更新的分类' }, { status: 404 })
    }
    logger.info(`[Category Update] Success: Category ${categoryId} updated`)
    return NextResponse.json({ message: '分类更新成功' })
  } catch (e: any) {
    logger.error('[Category Update] Database error:', e)
    return NextResponse.json({ message: '更新分类失败' }, { status: 500 })
  }
}
