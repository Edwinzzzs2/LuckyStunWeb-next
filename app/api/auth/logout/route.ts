import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST() {
  logger.info('[Logout] Request received')
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

