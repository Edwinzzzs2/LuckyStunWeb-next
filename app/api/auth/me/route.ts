import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { logApiCall, logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  await logApiCall(req)
  logger.info('[Auth Me] Checking session...')
  const user = getAuthUser(req)
  if (!user) {
    logger.warn('[Auth Me] Unauthorized access attempt')
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  logger.info(`[Auth Me] Authorized user: ${user.username}`)
  return NextResponse.json({
    user: {
      id: user.userId,
      username: user.username,
      isAdmin: user.isAdmin,
    },
  })
}
