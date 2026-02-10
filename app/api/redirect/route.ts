import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  await logApiCall(req)
  // logger.info('[Redirect GET] Request received')
  const url = new URL(req.url)
  const id = Number(url.searchParams.get('id'))
  if (!Number.isInteger(id)) {
    logger.warn(`[Redirect GET] Invalid ID: ${url.searchParams.get('id')}`)
    return NextResponse.json({ success: false, message: '无效的站点ID' }, { status: 400 })
  }
  
  logger.info(`[Redirect GET] Fetching site ${id}`)
  
  try {
    const results = await query(
      'SELECT id, url, backup_url, internal_url, logo, title, "desc" FROM sites WHERE id = $1'
      ,
      [id]
    )
    if (results.length === 0) {
      logger.warn(`[Redirect GET] Site not found: ${id}`)
      return NextResponse.json({ success: false, not_found: true, message: `未找到ID为${id}的站点` })
    }
    return NextResponse.json({ success: true, data: results[0] })
  } catch (e: any) {
    logger.error('[Redirect GET] Database error:', e)
    return NextResponse.json({ success: false, message: '数据库查询失败' }, { status: 500 })
  }
}
