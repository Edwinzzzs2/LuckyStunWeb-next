import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logApiCall, logger } from '@/lib/logger'

export async function GET(req: Request) {
  await logApiCall(req)
  logger.info('[Categories Flat] Request received')
  try {
    const rows = await query(
      'SELECT id, name, parent_id FROM categories ORDER BY parent_id ASC, sort_order ASC, id ASC'
    )
    const flat = rows.map((item) => ({ id: item.id, name: item.name }))
    return NextResponse.json(flat)
  } catch (e: any) {
    logger.error('[Categories Flat] Database error:', e)
    return NextResponse.json({ message: '获取分类失败' }, { status: 500 })
  }
}
