import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { execute } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await logApiCall(req)
  const params = await context.params
  logger.info(`[Site Delete] Request received for ID: ${params.id}`)
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Site Delete] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Site Delete] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }
  const siteId = Number(params.id)
  if (!Number.isInteger(siteId)) {
    logger.warn(`[Site Delete] Invalid ID: ${params.id}`)
    return NextResponse.json({ message: '无效的网站 ID' }, { status: 400 })
  }
  try {
    const result = await execute('DELETE FROM sites WHERE id = $1', [siteId])
    if (result.rowCount === 0) {
      logger.warn(`[Site Delete] Site not found: ${siteId}`)
      return NextResponse.json({ message: '未找到要删除的网站' }, { status: 404 })
    }
    logger.info(`[Site Delete] Success: Site ${siteId} deleted by ${user.username}`)
    return NextResponse.json({ message: '网站删除成功' })
  } catch (e: any) {
    logger.error('[Site Delete] Database error:', e)
    return NextResponse.json({ message: '删除网站失败' }, { status: 500 })
  }
}
