import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '@/lib/api'
import { query } from '@/lib/db'
import { signToken } from '@/lib/auth'
import { logger } from '@/lib/logger'

type LoginBody = { username?: string; password?: string }

export async function POST(req: NextRequest) {
  const { data, error } = await readJson<LoginBody>(req)
  if (error) {
    logger.error('[Login] JSON parse error:', error)
    return error
  }
  const username = data?.username?.trim()
  const password = data?.password
  
  logger.info(`[Login] Attempt for user: ${username}`)

  if (!username || !password) {
    logger.warn('[Login] Missing username or password')
    return NextResponse.json({ message: '请提供用户名和密码' }, { status: 400 })
  }
  const users = await query(
    'SELECT id, username, password_hash, is_admin FROM users WHERE username = $1'
    ,
    [username]
  )
  if (users.length === 0) {
    logger.warn(`[Login] User not found: ${username}`)
    return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 })
  }
  const user = users[0]
  const ok = await bcrypt.compare(password, user.password_hash)

  if (!ok) {
    logger.warn(`[Login] Password mismatch for user: ${username}`)
    return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 })
  }
  
  logger.info(`[Login] Success for user: ${username}`)
  
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
