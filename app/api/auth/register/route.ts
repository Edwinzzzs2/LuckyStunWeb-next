import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'

type RegisterBody = { username?: string; password?: string; isAdmin?: boolean }

export async function POST(req: NextRequest) {
  const { data, error } = await readJson<RegisterBody>(req)
  if (error) return error
  const username = data?.username?.trim()
  const password = data?.password
  const isAdmin = data?.isAdmin === true
  if (!username || !password) {
    return NextResponse.json({ message: '用户名和密码不能为空' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ message: '密码长度至少为6个字符' }, { status: 400 })
  }
  const existing = await query('SELECT id FROM users WHERE username = $1', [username])
  if (existing.length > 0) {
    return NextResponse.json({ message: '用户名已存在' }, { status: 409 })
  }
  const passwordHash = await bcrypt.hash(password, 10)
  const result = await execute(
    'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id'
    ,
    [username, passwordHash, isAdmin]
  )
  return NextResponse.json(
    {
      message: '注册成功',
      user: { id: result.rows[0]?.id, username, isAdmin },
    },
    { status: 201 }
  )
}
