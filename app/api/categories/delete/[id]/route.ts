import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, execute } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await logApiCall(req)
  const params = await context.params
  logger.info(`[Category Delete] Request received for ID: ${params.id}`)
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Category Delete] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Category Delete] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }
  const categoryId = Number(params.id)
  if (!Number.isInteger(categoryId)) {
    logger.warn(`[Category Delete] Invalid ID: ${params.id}`)
    return NextResponse.json({ message: '无效的分类 ID' }, { status: 400 })
  }
  try {
    const children = await query('SELECT id FROM categories WHERE parent_id = $1 LIMIT 1', [categoryId])
    if (children.length > 0) {
      logger.warn(`[Category Delete] Failed: Category ${categoryId} has children`)
      return NextResponse.json({ message: '无法删除，请先删除或移动该分类下的子分类' }, { status: 400 })
    }
    const sites = await query('SELECT id FROM sites WHERE category_id = $1 LIMIT 1', [categoryId])
    if (sites.length > 0) {
      logger.warn(`[Category Delete] Failed: Category ${categoryId} has sites`)
      return NextResponse.json({ message: '无法删除，请先解除该分类下网站的关联' }, { status: 400 })
    }
    const result = await execute('DELETE FROM categories WHERE id = $1', [categoryId])
    if (result.rowCount === 0) {
      logger.warn(`[Category Delete] Category not found: ${categoryId}`)
      return NextResponse.json({ message: '未找到要删除的分类' }, { status: 404 })
    }
    logger.info(`[Category Delete] Success: Category ${categoryId} deleted by ${user.username}`)
    return NextResponse.json({ message: '分类删除成功' })
  } catch (e: any) {
    logger.error('[Category Delete] Database error:', e)
    return NextResponse.json({ message: '删除分类失败' }, { status: 500 })
  }
}
