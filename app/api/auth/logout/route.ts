import { NextResponse } from 'next/server'
import { logApiCall, logger, createWebhookLogger } from '@/lib/logger'
import { getAuthUser } from '@/lib/auth'

export async function POST(req: Request) {
  await logApiCall(req)
  
  // 获取客户端IP
  const forwarded = req.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || req.headers.get('x-real-ip') || ''
  
  // 获取当前用户信息
  const user = getAuthUser(req)
  
  const authLog = createWebhookLogger({ source: 'auth', prefix: '[退出]', ip })
  
  logger.info('[Logout] Request received')
  
  if (user) {
    await authLog('info', '用户退出登录', { 
      username: user.username, 
      userId: user.userId, 
      isAdmin: user.isAdmin 
    })
  } else {
    await authLog('warn', '退出登录时用户未登录', {})
  }
  
  const res = NextResponse.json({ message: '已退出登录' })
  res.cookies.set('token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return res
}

