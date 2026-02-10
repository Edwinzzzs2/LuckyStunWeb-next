import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '@/lib/api'
import { query } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { logApiCall, logger, createWebhookLogger } from '@/lib/logger'

type LoginBody = { username?: string; password?: string }

export async function POST(req: NextRequest) {
  await logApiCall(req)
  
  // 获取客户端IP
  const forwarded = req.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || req.headers.get('x-real-ip') || ''
  
  const { data, error } = await readJson<LoginBody>(req)
  if (error) {
    logger.error('[Login] JSON parse error:', error)
    return error
  }
  const username = data?.username?.trim()
  const password = data?.password
  
  const authLog = createWebhookLogger({ source: 'auth', prefix: '[登录]', ip })
  
  logger.info(`[Login] Attempt for user: ${username}`)

  if (!username || !password) {
    logger.warn('[Login] Missing username or password')
    await authLog('warn', '登录失败：用户名或密码为空', { username })
    return NextResponse.json({ message: '请提供用户名和密码' }, { status: 400 })
  }
  const users = await query(
    'SELECT id, username, password_hash, is_admin FROM users WHERE username = $1'
    ,
    [username]
  )
  if (users.length === 0) {
    logger.warn(`[Login] User not found: ${username}`)
    await authLog('warn', '登录失败：用户不存在', { username })
    return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 })
  }
  const user = users[0]
  const ok = await bcrypt.compare(password, user.password_hash)

  if (!ok) {
    logger.warn(`[Login] Password mismatch for user: ${username}`)
    await authLog('warn', '登录失败：密码错误', { username })
    return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 })
  }
  
  logger.info(`[Login] Success for user: ${username}`)
  await authLog('info', '登录成功', { 
    username, 
    userId: user.id, 
    isAdmin: user.is_admin === true || user.is_admin === 1 
  })
  
  const payload = { userId: user.id, username: user.username, isAdmin: user.is_admin === true || user.is_admin === 1 }
  const token = signToken(payload)
  const res = NextResponse.json({
    token,
    user: { id: user.id, username: user.username, isAdmin: user.is_admin === true || user.is_admin === 1 },
  })
  res.cookies.set('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
