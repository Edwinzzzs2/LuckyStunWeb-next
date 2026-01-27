import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const siteId = Number(params.id)
  if (!Number.isInteger(siteId)) {
    return NextResponse.json({ message: '无效的网站 ID' }, { status: 400 })
  }
  const results = await query(
    'SELECT s.*, c.name as category_name FROM sites s LEFT JOIN categories c ON s.category_id = c.id WHERE s.id = $1'
    ,
    [siteId]
  )
  if (results.length === 0) {
    return NextResponse.json({ message: '未找到指定网站' }, { status: 404 })
  }
  return NextResponse.json(results[0])
}
