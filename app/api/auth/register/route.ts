import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'
import { logger } from '@/lib/logger'

type RegisterBody = { username?: string; password?: string; isAdmin?: boolean }

export async function POST(req: NextRequest) {
  logger.info('[Register] Request received')
  const { data, error } = await readJson<RegisterBody>(req)
  if (error) {
    logger.error('[Register] JSON parse error:', error)
    return error
  }
  const username = data?.username?.trim()
  const password = data?.password
  const isAdmin = data?.isAdmin === true
  
  logger.info(`[Register] Attempt for user: ${username}, isAdmin: ${isAdmin}`)

  if (!username || !password) {
    logger.warn('[Register] Missing username or password')
    return NextResponse.json({ message: '用户名和密码不能为空' }, { status: 400 })
  }
  if (password.length < 6) {
    logger.warn('[Register] Password too short')
    return NextResponse.json({ message: '密码长度至少为6个字符' }, { status: 400 })
  }
  try {
    const existing = await query('SELECT id FROM users WHERE username = $1', [username])
    if (existing.length > 0) {
      logger.warn(`[Register] Username already exists: ${username}`)
      return NextResponse.json({ message: '用户名已存在' }, { status: 409 })
    }
    const passwordHash = await bcrypt.hash(password, 10)
    const result = await execute(
      'INSERT INTO users (username, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id'
      ,
      [username, passwordHash, isAdmin]
    )
    logger.info(`[Register] Success: User ${username} created with ID ${result.rows[0]?.id}`)
    return NextResponse.json(
      {
        message: '注册成功',
        user: { id: result.rows[0]?.id, username, isAdmin },
      },
      { status: 201 }
    )
  } catch (e: any) {
    logger.error('[Register] Database error:', e)
    return NextResponse.json({ message: '注册失败' }, { status: 500 })
  }
}
