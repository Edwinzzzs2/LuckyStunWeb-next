import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  await logApiCall(req)
  logger.info('[Auth Users] Request received')
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Auth Users] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    logger.warn(`[Auth Users] Forbidden access attempt by ${user.username}`)
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '10'))
  const offset = (page - 1) * pageSize
  
  logger.info(`[Auth Users] Fetching users page ${page}, size ${pageSize} by ${user.username}`)

  try {
    const rows = await query(
      'SELECT id, username, is_admin, created_at FROM users ORDER BY id ASC LIMIT $1 OFFSET $2',
      [pageSize, offset]
    )
    const totalResult = await query('SELECT COUNT(*) as total FROM users')
    const total = parseInt(totalResult[0].total)

    const users = rows.map((item) => ({
      id: item.id,
      username: item.username,
      isAdmin: item.is_admin === true || item.is_admin === 1,
      createdAt: item.created_at,
    }))
    return NextResponse.json({ users, total })
  } catch (e: any) {
    logger.error('[Auth Users] Database error:', e)
    return NextResponse.json({ message: '获取用户列表失败' }, { status: 500 })
  }
}
