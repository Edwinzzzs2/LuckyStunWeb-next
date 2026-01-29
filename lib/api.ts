import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function error(message: string, status = 500) {
  return NextResponse.json({ message }, { status })
}

export async function readJson<T>(req: Request) {
  try {
    // logger.info('[API] Reading JSON body...')
    const body = (await req.json()) as T
    // logger.info('[API] JSON body read successfully')
    return { data: body, error: null }
  } catch (e) {
    logger.error('[API] JSON read error:', e)
    return { data: null as T | null, error: error('无效的 JSON 请求体', 400) }
  }
}
