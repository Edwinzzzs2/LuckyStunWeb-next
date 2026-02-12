import { NextResponse } from 'next/server'
import { getSetting } from '@/lib/settings'

export async function GET() {
  const url = (process.env.CLIENT_IP_API_URL || '').trim()
  if (!url) {
    return NextResponse.json({ message: '未配置 CLIENT_IP_API_URL' }, { status: 500 })
  }

  let clientIp = ''
  let payload: any = null
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ message: 'IP 查询失败', status: res.status }, { status: 502 })
    }
    payload = await res.json()
    const raw = payload?.ClientIP ?? payload?.clientIP ?? payload?.clientIp ?? payload?.ip
    clientIp = raw ? String(raw).trim() : ''
  } catch (e: any) {
    return NextResponse.json({ message: 'IP 查询异常', error: e?.message || 'unknown' }, { status: 502 })
  }

  const luckyIp = (await getSetting('lucky_ip')) || ''
  const luckyPort = (await getSetting('lucky_port')) || ''
  const isInternal = !!clientIp && !!luckyIp && clientIp === luckyIp

  return NextResponse.json({ clientIp, luckyIp, luckyPort, isInternal, payload })
}
