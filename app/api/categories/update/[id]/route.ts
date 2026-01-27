import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { execute } from '@/lib/db'

type Body = { name?: string; en_name?: string; icon?: string; parent_id?: number | string | null; sort_order?: number }

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const categoryId = Number(params.id)
  if (!Number.isInteger(categoryId)) {
    return NextResponse.json({ message: '无效的分类 ID' }, { status: 400 })
  }
  const { data, error } = await readJson<Body>(req)
  if (error) return error
  const name = data?.name?.trim()
  if (!name) return NextResponse.json({ message: '分类名称不能为空' }, { status: 400 })
  const parentValue = data?.parent_id
  const parentId = parentValue && parentValue !== '0' ? Number(parentValue) : null
  if (parentId === categoryId) {
    return NextResponse.json({ message: '不能将分类的父级设置为自身' }, { status: 400 })
  }
  const sortOrder = Number.isFinite(data?.sort_order) ? Number(data?.sort_order) : 0
  const result = await execute(
    'UPDATE categories SET name = $1, en_name = $2, icon = $3, parent_id = $4, sort_order = $5 WHERE id = $6'
    ,
    [name, data?.en_name || null, data?.icon || null, parentId, sortOrder, categoryId]
  )
  if (result.rowCount === 0) {
    return NextResponse.json({ message: '未找到要更新的分类' }, { status: 404 })
  }
  return NextResponse.json({ message: '分类更新成功' })
}
