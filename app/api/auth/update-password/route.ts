import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'

type Body = { newPassword?: string; userId?: number }

export async function POST(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const { data, error } = await readJson<Body>(req)
  if (error) return error
  const userId = Number(data?.userId)
  const newPassword = data?.newPassword
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ message: '提供的用户 ID 无效' }, { status: 400 })
  }
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: '新密码长度至少为6个字符' }, { status: 400 })
  }
  const results = await query('SELECT username FROM users WHERE id = $1', [userId])
  if (results.length === 0) {
    return NextResponse.json({ message: '目标用户不存在' }, { status: 404 })
  }
  const targetUser = results[0]
  const newHash = await bcrypt.hash(newPassword, 10)
  const result = await execute('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId])
  if (result.rowCount === 0) {
    return NextResponse.json({ message: '目标用户不存在 (更新时)' }, { status: 404 })
  }
  return NextResponse.json({ message: `用户 ${targetUser.username} 的密码已重置` })
}
