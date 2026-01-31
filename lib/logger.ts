import { execute } from '@/lib/db'

export const logger = {
  info: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
    console.log(`[${timestamp}]`, ...args)
  },
  warn: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
    console.warn(`[${timestamp}]`, ...args)
  },
  error: (...args: any[]) => {
    const timestamp = new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
    console.error(`[${timestamp}]`, ...args)
  },
}

export function createWebhookLogger({
  source,
  prefix,
  ip,
}: {
  source: string
  prefix: string
  ip?: string | null
}) {
  return async (
    level: 'info' | 'warn' | 'error',
    message: string,
    meta?: Record<string, unknown>,
    status?: number
  ) => {
    const content = meta ? `${message} ${JSON.stringify(meta)}` : message
    if (level === 'info') logger.info(`${prefix} ${content}`)
    if (level === 'warn') logger.warn(`${prefix} ${content}`)
    if (level === 'error') logger.error(`${prefix} ${content}`)
    try {
      await execute(
        'INSERT INTO webhook_logs (source, level, message, meta, status, ip) VALUES ($1, $2, $3, $4, $5, $6)',
        [source, level, message, meta ? JSON.stringify(meta) : null, status ?? null, ip || null]
      )
    } catch (e: any) {
      logger.error(`${prefix} 日志写入失败:`, e)
    }
  }
}
