import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) {
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  if (!user.isAdmin) {
    return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10')))
  const source = (searchParams.get('source') || '').trim()
  const level = (searchParams.get('level') || '').trim()
  const q = (searchParams.get('q') || '').trim()
  const offset = (page - 1) * pageSize

  const where: string[] = []
  const values: any[] = []
  if (source && source !== 'all') {
    values.push(source)
    where.push(`source = $${values.length}`)
  }
  if (level && level !== 'all') {
    values.push(level)
    where.push(`level = $${values.length}`)
  }
  if (q) {
    values.push(`%${q}%`)
    where.push(`(message ILIKE $${values.length} OR meta::text ILIKE $${values.length})`)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  try {
    const logs = await query(
      `SELECT id, source, level, message, meta, status, ip, created_at FROM webhook_logs ${whereSql} ORDER BY id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, pageSize, offset]
    )
    const countRows = await query(
      `SELECT COUNT(*) as total FROM webhook_logs ${whereSql}`,
      values
    )
    const total = Number(countRows[0]?.total || 0)
    return NextResponse.json({ logs, total })
  } catch (e: any) {
    logger.error('[Webhook Logs] Database error:', e)
    return NextResponse.json({ message: '获取日志失败' }, { status: 500 })
  }
}
