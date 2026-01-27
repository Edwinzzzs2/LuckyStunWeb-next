import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { query, execute } from '@/lib/db'

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const categoryId = Number(params.id)
  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ message: '无效的分类 ID' }, { status: 400 })
  }
  const children = await query('SELECT id FROM categories WHERE parent_id = $1 LIMIT 1', [categoryId])
  if (children.length > 0) {
    return NextResponse.json({ message: '无法删除，请先删除或移动该分类下的子分类' }, { status: 400 })
  }
  const sites = await query('SELECT id FROM sites WHERE category_id = $1 LIMIT 1', [categoryId])
  if (sites.length > 0) {
    return NextResponse.json({ message: '无法删除，请先解除该分类下网站的关联' }, { status: 400 })
  }
  const result = await execute('DELETE FROM categories WHERE id = $1', [categoryId])
  if (result.rowCount === 0) {
    return NextResponse.json({ message: '未找到要删除的分类' }, { status: 404 })
  }
  return NextResponse.json({ message: '分类删除成功' })
}
