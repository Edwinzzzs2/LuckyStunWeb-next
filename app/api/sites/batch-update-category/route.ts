import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

type Body = { site_ids?: number[]; category_id?: number | null; is_visible?: boolean | number }

export async function POST(req: NextRequest) {
  await logApiCall(req)
  logger.info('[Sites Batch Update] Request received')
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Sites Batch Update] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Sites Batch Update] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }
  const { data, error } = await readJson<Body>(req)
  if (error) {
    logger.error('[Sites Batch Update] JSON parse error:', error)
    return error
  }
  
  logger.info(`[Sites Batch Update] Request by ${user.username}, sites: ${data?.site_ids?.length}`)

  if (!Array.isArray(data?.site_ids) || data.site_ids.length === 0) {
    return NextResponse.json({ message: '站点ID列表为必填项' }, { status: 400 })
  }
  const updateFields: string[] = []
  const updateValues: any[] = []
  
  try {
    if (data.category_id !== undefined && data.category_id !== null) {
      const categories = await query('SELECT id FROM categories WHERE id = $1', [data.category_id])
      if (categories.length === 0) {
        logger.warn(`[Sites Batch Update] Target category not found: ${data.category_id}`)
        return NextResponse.json({ message: '目标分类不存在' }, { status: 400 })
      }
      updateFields.push(`category_id = $${updateValues.length + 1}`)
      updateValues.push(data.category_id)
    }
    if (data.is_visible !== undefined) {
      updateFields.push(`is_visible = $${updateValues.length + 1}`)
      updateValues.push(Boolean(data.is_visible))
    }
    if (updateFields.length === 0) {
      return NextResponse.json({ message: '至少需要提供一个更新字段' }, { status: 400 })
    }
    const idsIndex = updateValues.length + 1
    const result = await execute(
      `UPDATE sites SET ${updateFields.join(', ')} WHERE id = ANY($${idsIndex}::int[])`
      ,
      [...updateValues, data.site_ids]
    )
    if (result.rowCount === 0) {
      logger.warn('[Sites Batch Update] No sites updated')
      return NextResponse.json({ message: '未找到要更新的站点' }, { status: 404 })
    }
    logger.info(`[Sites Batch Update] Success: Updated ${result.rowCount} sites`)
    const message = data.category_id !== undefined && data.category_id !== null
      ? '批量更新站点分类成功'
      : '批量更新站点状态成功'
    return NextResponse.json({ message })
  } catch (e: any) {
    logger.error('[Sites Batch Update] Database error:', e)
    return NextResponse.json({ message: '批量更新失败' }, { status: 500 })
  }
}
