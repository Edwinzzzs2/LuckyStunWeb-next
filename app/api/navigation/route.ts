import { NextResponse } from 'next/server'
import { getNavigationTree } from '@/lib/navigation'
import { logApiCall, logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  await logApiCall(req)
  logger.info('[Navigation GET] Request received')
  try {
    const tree = await getNavigationTree()
    return NextResponse.json(tree)
  } catch (error: any) {
    logger.error('[Navigation GET] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
