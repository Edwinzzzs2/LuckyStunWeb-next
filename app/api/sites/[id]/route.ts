import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await logApiCall(req)
  const params = await context.params
  logger.info(`[Site Details] Request received for ID: ${params.id}`)
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Site Details] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Site Details] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }
  const siteId = Number(params.id)
  if (!Number.isInteger(siteId)) {
    logger.warn(`[Site Details] Invalid ID: ${params.id}`)
    return NextResponse.json({ message: '无效的网站 ID' }, { status: 400 })
  }
  try {
    const results = await query(
      'SELECT s.*, c.name as category_name FROM sites s LEFT JOIN categories c ON s.category_id = c.id WHERE s.id = $1'
      ,
      [siteId]
    )
    if (results.length === 0) {
      logger.warn(`[Site Details] Site not found: ${siteId}`)
      return NextResponse.json({ message: '未找到指定网站' }, { status: 404 })
    }
    return NextResponse.json(results[0])
  } catch (e: any) {
    logger.error('[Site Details] Database error:', e)
    return NextResponse.json({ message: '获取网站详情失败' }, { status: 500 })
  }
}
