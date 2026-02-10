import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { execute } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await logApiCall(req)
  const params = await context.params
  logger.info(`[Auth Delete] Request received for ID: ${params.id}`)
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Auth Delete] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Auth Delete] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }
  const userIdToDelete = Number(params.id)
  if (!Number.isInteger(userIdToDelete)) {
    logger.warn(`[Auth Delete] Invalid user ID: ${params.id}`)
    return NextResponse.json({ message: '无效的用户 ID' }, { status: 400 })
  }
  if (userIdToDelete === user.userId) {
    logger.warn(`[Auth Delete] User ${user.username} attempted to delete themselves`)
    return NextResponse.json({ message: '不能删除自己的账户' }, { status: 400 })
  }
  try {
    const result = await execute('DELETE FROM users WHERE id = $1', [userIdToDelete])
    if (result.rowCount === 0) {
      logger.warn(`[Auth Delete] User not found: ${userIdToDelete}`)
      return NextResponse.json({ message: '未找到要删除的用户' }, { status: 404 })
    }
    logger.info(`[Auth Delete] User ${userIdToDelete} deleted by ${user.username}`)
    return NextResponse.json({ message: '用户删除成功' })
  } catch (e: any) {
    logger.error(`[Auth Delete] Database error:`, e)
    return NextResponse.json({ message: '删除用户失败' }, { status: 500 })
  }
}
