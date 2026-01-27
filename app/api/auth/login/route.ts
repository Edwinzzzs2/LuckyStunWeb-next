import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '@/lib/api'
import { query } from '@/lib/db'
import { signToken } from '@/lib/auth'

type LoginBody = { username?: string; password?: string }

export async function POST(req: NextRequest) {
  const { data, error } = await readJson<LoginBody>(req)
  if (error) return error
  const username = data?.username?.trim()
  const password = data?.password
  if (!username || !password) {
    return NextResponse.json({ message: '请提供用户名和密码' }, { status: 400 })
  }
  const users = await query(
    'SELECT id, username, password_hash, is_admin FROM users WHERE username = $1'
    ,
    [username]
  )
  if (users.length === 0) {
    return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 })
  }
  const user = users[0]
  const ok = await bcrypt.compare(password, user.password_hash)
  if (!ok) {
    return NextResponse.json({ message: '用户名或密码错误' }, { status: 401 })
  }
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
