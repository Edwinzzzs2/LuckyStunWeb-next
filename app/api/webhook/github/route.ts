import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * GitHub Webhook 接收器
 * 路径: /api/webhook/github
 */
export async function POST(req: NextRequest) {
  const log = (
    level: 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, unknown>
  ) => {
    const prefix = '[GitHub Webhook]'
    const content = meta ? `${message} ${JSON.stringify(meta)}` : message
    console[level](`${prefix} ${content}`)
  }

  try {
    const payload = await req.text()
    const signature = req.headers.get('x-hub-signature-256') || ''
    const event = req.headers.get('x-github-event') || 'unknown'
    const delivery = req.headers.get('x-github-delivery') || 'unknown'

    log('info', '收到事件', { event, delivery })
    
    const secret = process.env.WEBHOOK_SECRET
    if (secret) {
      if (signature) {
        const hmac = crypto.createHmac('sha256', secret)
        const digest = 'sha256=' + hmac.update(payload).digest('hex')
        const signatureBuffer = Buffer.from(signature)
        const digestBuffer = Buffer.from(digest)

        if (signatureBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
          log('error', '签名校验失败')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      } else {
        log('error', '缺少签名头')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const data = JSON.parse(payload)
    const ref = data.ref
    
    // 2. 自动更新逻辑 (仅限 main 分支 push)
    if (event === 'push' && ref === 'refs/heads/main') {
      log('info', '检测到 main 分支推送，开始触发 1Panel 流程')
      
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
        log('error', '1Panel 配置缺失，请检查环境变量')
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
            log('info', '触发 1Panel 定时任务', { cronjobId })
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
            log('info', '定时任务返回', { bodyText })
          } catch (e: any) {
            log('error', '触发定时任务失败', { message: e.message })
          }

          if (Number.isFinite(delayMs) && delayMs > 0) {
            log('info', '等待延时后继续', { delayMs })
            await new Promise((resolve) => setTimeout(resolve, delayMs))
          }
        }

        for (const op of operates) {
          try {
            log('info', '触发 1Panel 操作', { op })
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
            log('info', '操作返回', { op, bodyText })
          } catch (e: any) {
            log('error', '操作失败', { op, message: e.message })
          }
        }
      }

      void triggerOperates()
    }

    return NextResponse.json({ message: 'Process triggered', event, delivery })
  } catch (err: any) {
    log('error', '处理失败', { message: err.message })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
