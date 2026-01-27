import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { execute } from '@/lib/db'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const siteId = Number(params.id)
  if (!Number.isInteger(siteId)) {
    return NextResponse.json({ message: '无效的网站 ID' }, { status: 400 })
  }
  const result = await execute('DELETE FROM sites WHERE id = $1', [siteId])
  if (result.rowCount === 0) {
    return NextResponse.json({ message: '未找到要删除的网站' }, { status: 404 })
  }
  return NextResponse.json({ message: '网站删除成功' })
}
