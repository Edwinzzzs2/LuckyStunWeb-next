import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { readJson } from '@/lib/api'
import { logApiCall } from '@/lib/logger'
import { getIconfontUrl, setSetting } from '@/lib/settings'

export async function GET(req: NextRequest) {
  await logApiCall(req)
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const url = await getIconfontUrl()
  return NextResponse.json({ url })
}

export async function POST(req: NextRequest) {
  await logApiCall(req)
  const user = getAuthUser(req)
  if (!user) return NextResponse.json({ message: '需要登录' }, { status: 401 })
  if (!user.isAdmin) return NextResponse.json({ message: '需要管理员权限' }, { status: 403 })
  const { data, error } = await readJson<{ url?: string }>(req)
  if (error) return error
  const url = (data?.url || '').trim()
  if (!url) return NextResponse.json({ message: '请提供 iconfont 地址' }, { status: 400 })
  await setSetting('iconfont_url', url)
  return NextResponse.json({ message: '已保存' })
}
