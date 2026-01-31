import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * GitHub Webhook 接收器
 * 路径: /api/webhook/github
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const signature = req.headers.get('x-hub-signature-256') || ''
    const event = req.headers.get('x-github-event') || 'unknown'
    const delivery = req.headers.get('x-github-delivery') || 'unknown'

    // 打印基础日志
    console.log(`[GitHub Webhook] Received event: ${event}`)
    console.log(`[GitHub Webhook] Delivery ID: ${delivery}`)

    // 校验签名 (安全建议)
    const secret = process.env.WEBHOOK_SECRET
    if (secret) {
      // 1. 尝试 GitHub 标准签名校验 (x-hub-signature-256)
      if (signature) {
        const hmac = crypto.createHmac('sha256', secret)
        const digest = 'sha256=' + hmac.update(payload).digest('hex')
        
        const signatureBuffer = Buffer.from(signature)
        const digestBuffer = Buffer.from(digest)

        if (signatureBuffer.length === digestBuffer.length && crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
          console.log('[GitHub Webhook] Signature verified via GitHub Header.')
        } else {
          console.error('[GitHub Webhook] Signature verification failed!')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      } 
      // 2. 尝试 Bearer Token 校验 (方便手动测试)
      else {
        const authHeader = req.headers.get('authorization') || ''
        const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
        
        if (bearerToken === secret) {
          console.log('[GitHub Webhook] Verified via Bearer Token.')
        } else {
          console.error('[GitHub Webhook] Auth failed: No signature and invalid Bearer token.')
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
    } else {
      console.warn('[GitHub Webhook] WEBHOOK_SECRET not set, skipping signature verification.')
    }

    // 解析内容并打印
    const data = JSON.parse(payload)
    
    // 针对不同事件打印关键信息
    if (event === 'push') {
      const ref = data.ref
      const commits = data.commits || []
      const pusher = data.pusher?.name
      console.log(`[GitHub Webhook] Push to ${ref} by ${pusher}: ${commits.length} commits`)
      commits.forEach((c: any) => console.log(`  - ${c.id.slice(0, 7)}: ${c.message}`))
    } else {
      // 其它事件打印整个 body (或者你感兴趣的部分)
      console.log('[GitHub Webhook] Payload:', JSON.stringify(data, null, 2))
    }

    return NextResponse.json({ message: 'ok', event, delivery })
  } catch (err: any) {
    console.error('[GitHub Webhook] Error processing webhook:', err.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
