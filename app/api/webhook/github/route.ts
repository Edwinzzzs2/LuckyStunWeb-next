import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { exec } from 'child_process'
import path from 'path'

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
    
    // 校验签名
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
    
    // 自动更新逻辑
    if (event === 'push' && data.ref === 'refs/heads/main') {
      console.log('[GitHub Webhook] Main branch push detected. Triggering update...')
      
      // 异步执行更新脚本，不阻塞 HTTP 响应
      const scriptPath = path.join(process.cwd(), 'scripts', 'deploy.sh')
      
      exec(`sh ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`[GitHub Webhook] Update script error: ${error.message}`)
          return
        }
        if (stderr) {
          console.warn(`[GitHub Webhook] Update script stderr: ${stderr}`)
        }
        console.log(`[GitHub Webhook] Update script output:\n${stdout}`)
      })
    }

    return NextResponse.json({ message: 'Update triggered', event, delivery })
  } catch (err: any) {
    console.error('[GitHub Webhook] Error processing webhook:', err.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
