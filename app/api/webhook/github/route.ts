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
    
    // 1. 校验 GitHub 签名
    const secret = process.env.WEBHOOK_SECRET
    if (secret) {
      if (signature) {
        const hmac = crypto.createHmac('sha256', secret)
        const digest = 'sha256=' + hmac.update(payload).digest('hex')
        const signatureBuffer = Buffer.from(signature)
        const digestBuffer = Buffer.from(digest)

        if (signatureBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
          console.error('[GitHub Webhook] Signature verification failed!')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const data = JSON.parse(payload)
    const ref = data.ref
    
    // 2. 自动更新逻辑 (仅限 main 分支 push)
    if (event === 'push' && ref === 'refs/heads/main') {
      console.log('[GitHub Webhook] Main branch push detected. Triggering 1Panel update...')
      
      const apiKey = process.env.PANEL_API_KEY
      const runtimeId = process.env.PANEL_RUNTIME_ID
      const apiUrl = process.env.PANEL_API_URL
      const operates = (process.env.PANEL_OPERATES || 'restart')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      const cronjobId = process.env.PANEL_CRONJOB_ID || ''
      const cronjobUrl = process.env.PANEL_CRONJOB_URL || ''
      const delayMs = Number(process.env.PANEL_DELAY_MS || '30000')

      if (!apiKey || !runtimeId || !apiUrl) {
        console.error('[GitHub Webhook] 1Panel config missing in environment variables')
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      // 3. 计算 1Panel API Token
      const timestamp = Math.floor(Date.now() / 1000)
      const rawString = `1panel${apiKey}${timestamp}`
      const token = crypto.createHash('md5').update(rawString).digest('hex')

      // 4. 调用 1Panel API (异步执行，不阻塞响应)
      const triggerOperates = async () => {
        if (cronjobId && cronjobUrl) {
          try {
            console.log('[GitHub Webhook] Triggering 1Panel cronjob...')
            const res = await fetch(cronjobUrl, {
              method: 'POST',
              headers: {
                '1Panel-Token': token,
                '1Panel-Timestamp': String(timestamp),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ id: Number(cronjobId) }),
            })
            const bodyText = await res.text()
            console.log(`[GitHub Webhook] 1Panel cronjob response: ${bodyText}`)
          } catch (e: any) {
            console.error('[GitHub Webhook] 1Panel cronjob failed:', e.message)
          }

          if (Number.isFinite(delayMs) && delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          }
        }

        for (const op of operates) {
          try {
            console.log(`[GitHub Webhook] Triggering 1Panel operate: ${op}`)
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                '1Panel-Token': token,
                '1Panel-Timestamp': String(timestamp),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ operate: op, ID: Number(runtimeId) }),
            })
            const bodyText = await res.text()
            console.log(`[GitHub Webhook] 1Panel ${op} response: ${bodyText}`)
          } catch (e: any) {
            console.error(`[GitHub Webhook] 1Panel ${op} failed:`, e.message)
          }
        }
      }

      void triggerOperates()
    }

    return NextResponse.json({ message: 'Process triggered', event, delivery })
  } catch (err: any) {
    console.error('[GitHub Webhook] Error processing webhook:', err.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
