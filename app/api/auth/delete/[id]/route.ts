import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { execute } from '@/lib/db'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const userIdToDelete = Number(params.id)
  if (!Number.isInteger(userIdToDelete)) {
    return NextResponse.json({ message: '无效的用户 ID' }, { status: 400 })
  }
  if (userIdToDelete === user.userId) {
    return NextResponse.json({ message: '不能删除自己的账户' }, { status: 400 })
  }
  const result = await execute('DELETE FROM users WHERE id = $1', [userIdToDelete])
  if (result.rowCount === 0) {
    return NextResponse.json({ message: '未找到要删除的用户' }, { status: 404 })
  }
  return NextResponse.json({ message: '用户删除成功' })
}
