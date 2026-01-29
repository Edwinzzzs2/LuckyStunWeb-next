import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') || '10'))
  const offset = (page - 1) * pageSize

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
}
