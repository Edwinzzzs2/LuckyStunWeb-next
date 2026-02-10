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

export async function logSystemStartupOnce() {
  const holder = globalThis as typeof globalThis & { __systemStartupLogged?: boolean }
  if (holder.__systemStartupLogged) return
  holder.__systemStartupLogged = true
  const log = createWebhookLogger({ source: 'system', prefix: '[系统]' })
  await log('info', '系统已启动')
}

export async function logApiCall(
  req: Request | { url: string; method?: string; headers?: Headers | Record<string, string> },
  extra?: Record<string, unknown>
) {
  try {
    const header = typeof (req as any).headers?.get === 'function' ? (req as any).headers : null
    const rawForwarded = header?.get('x-forwarded-for') || header?.get('x-forwarded-host') || ''
    const forwardedIp = rawForwarded.split(',')[0]?.trim() || ''
    const ip =
      forwardedIp ||
      header?.get('x-real-ip') ||
      header?.get('cf-connecting-ip') ||
      header?.get('x-client-ip') ||
      header?.get('x-forwarded') ||
      ''
    const log = createWebhookLogger({ source: 'api', prefix: '[接口]', ip })
    const method = (req as any).method || 'GET'
    const url = (req as any).url || ''
    const u = new URL(url, 'http://localhost')
    const pathname = u.pathname || ''
    if (pathname.startsWith('/api/webhook/logs')) return
    let biz = ''
    switch (true) {
      case pathname.startsWith('/api/categories'):
        biz = '分类管理'
        break
      case pathname.startsWith('/api/sites'):
        biz = '网站管理'
        break
      case pathname.startsWith('/api/auth'):
        biz = '用户管理'
        break
      case pathname.startsWith('/api/navigation'):
        biz = '导航数据'
        break
      case pathname.startsWith('/api/redirect'):
        biz = '站点跳转'
        break
      case pathname.startsWith('/api/settings/iconfont'):
        biz = '图标管理'
        break
      default:
        biz = ''
    }
    const message = biz ? `接口调用-${biz}` : '接口调用'
    await log('info', message, { method, url, ...(extra || {}) })
  } catch {}
}
