import { NextRequest, NextResponse } from 'next/server'
import { getSetting } from '@/lib/settings'

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for') || ''
  const forwardedIp = forwarded.split(',')[0]?.trim() || ''
  const clientIp =
    forwardedIp ||
    req.headers.get('x-real-ip') ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-client-ip') ||
    req.headers.get('x-forwarded') ||
    ''

  const luckyIp = (await getSetting('lucky_ip')) || ''
  const luckyPort = (await getSetting('lucky_port')) || ''
  const isInternal = !!clientIp && !!luckyIp && clientIp === luckyIp

  return NextResponse.json({ clientIp, luckyIp, luckyPort, isInternal, forwarded })
}
