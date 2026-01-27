import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const id = Number(url.searchParams.get('id'))
  if (!Number.isInteger(id)) {
    return NextResponse.json({ success: false, message: '无效的站点ID' }, { status: 400 })
  }
  const results = await query(
    'SELECT id, url, backup_url, internal_url, logo, title, "desc" FROM sites WHERE id = $1'
    ,
    [id]
  )
  if (results.length === 0) {
    return NextResponse.json({ success: false, not_found: true, message: `未找到ID为${id}的站点` })
  }
  return NextResponse.json({ success: true, data: results[0] })
}
