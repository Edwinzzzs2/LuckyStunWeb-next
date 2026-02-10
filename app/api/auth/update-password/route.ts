import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

type Body = { newPassword?: string; userId?: number }

export async function POST(req: NextRequest) {
  await logApiCall(req)
  logger.info('[Update Password] Request received')
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Update Password] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Update Password] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }
  const { data, error } = await readJson<Body>(req)
  if (error) {
    logger.error('[Update Password] JSON parse error:', error)
    return error
  }
  const userId = Number(data?.userId)
  const newPassword = data?.newPassword
  
  logger.info(`[Update Password] Request by ${user.username} to update user ${userId}`)

  if (!Number.isInteger(userId)) {
    logger.warn(`[Update Password] Invalid target user ID: ${data?.userId}`)
    return NextResponse.json({ message: '提供的用户 ID 无效' }, { status: 400 })
  }
  if (!newPassword || newPassword.length < 6) {
    logger.warn('[Update Password] Password too short')
    return NextResponse.json({ message: '新密码长度至少为6个字符' }, { status: 400 })
  }
  try {
    const results = await query('SELECT username FROM users WHERE id = $1', [userId])
    if (results.length === 0) {
      logger.warn(`[Update Password] Target user not found: ${userId}`)
      return NextResponse.json({ message: '目标用户不存在' }, { status: 404 })
    }
    const targetUser = results[0]
    const newHash = await bcrypt.hash(newPassword, 10)
    const result = await execute('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId])
    if (result.rowCount === 0) {
      logger.warn(`[Update Password] Update failed (rowCount=0) for user: ${userId}`)
      return NextResponse.json({ message: '目标用户不存在 (更新时)' }, { status: 404 })
    }
    logger.info(`[Update Password] Success: User ${targetUser.username} password updated by ${user.username}`)
    return NextResponse.json({ message: `用户 ${targetUser.username} 的密码已重置` })
  } catch (e: any) {
    logger.error('[Update Password] Database error:', e)
    return NextResponse.json({ message: '重置密码失败' }, { status: 500 })
  }
}
