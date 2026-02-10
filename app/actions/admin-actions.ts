'use server'

import { cookies } from 'next/headers'
import crypto from 'crypto'
import { verifyToken } from '@/lib/auth'
import { createWebhookLogger, logger } from '@/lib/logger'

export async function restartService() {
  const log = createWebhookLogger({ source: 'system', prefix: '[系统]' })
  try {
    const cookieStore = await cookies()
    const tokenStr = cookieStore.get('token')?.value
    
    if (!tokenStr) {
      await log('warn', '重启服务失败：未登录', undefined, 401)
      return { success: false, message: '未登录' }
    }
    
    const user = verifyToken(tokenStr)
    if (!user || !user.isAdmin) {
      await log('warn', '重启服务失败：权限不足', { user: user?.username || 'unknown' }, 403)
      return { success: false, message: '权限不足' }
    }

    await log('info', '请求重启服务', { user: user.username })

    const apiKey = process.env.PANEL_API_KEY
    const runtimeId = process.env.PANEL_RUNTIME_ID
    const apiUrl = process.env.PANEL_API_URL
    const operates = (process.env.PANEL_OPERATES || 'restart')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
    const cronjobId = process.env.PANEL_CRONJOB_ID || ''
    const cronjobUrl = process.env.PANEL_CRONJOB_URL || ''
    const delayMs = Number(process.env.PANEL_DELAY_MS || '60000')

    if (!apiKey || !runtimeId || !apiUrl) {
      logger.error('1Panel 配置缺失')
      await log('error', '重启服务失败：服务端配置缺失', undefined, 500)
      return { success: false, message: '服务端配置缺失' }
    }

    // 计算 1Panel API Token
    const timestamp = Math.floor(Date.now() / 1000)
    const rawString = `1panel${apiKey}${timestamp}`
    const token = crypto.createHash('md5').update(rawString).digest('hex')

    if (cronjobId && cronjobUrl) {
      logger.info(`[Admin] 触发 1Panel 定时任务: ${cronjobId} by ${user.username}`)
      await log('info', '触发 1Panel 定时任务', { cronjobId })
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
      if (!res.ok) {
        logger.error(`[Admin] 1Panel 定时任务失败: ${res.status}, ${bodyText}`)
        await log('error', '1Panel 定时任务失败', { status: res.status, bodyText }, res.status)
        return { success: false, message: `拉取代码失败: ${bodyText}` }
      }

      logger.info(`[Admin] 1Panel 定时任务触发成功，等待延时后重启`, { delayMs })
      await log('info', '1Panel 定时任务触发成功', { delayMs })
      if (Number.isFinite(delayMs) && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    // 依次触发操作
    for (const op of operates) {
      logger.info(`[Admin] 触发 1Panel 操作: ${op} by ${user.username}`)
      await log('info', `[Admin] 触发 1Panel 操作: ${op} by ${user.username}`, { op })
      
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          '1Panel-Token': token,
          '1Panel-Timestamp': String(timestamp),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operate: op, ID: Number(runtimeId) }),
      })

      if (!res.ok) {
        const text = await res.text()
        logger.error(`[Admin] 1Panel 操作失败: ${op}, ${res.status}, ${text}`)
        await log('error', '1Panel 操作失败', { op, status: res.status, bodyText: text }, res.status)
        return { success: false, message: `操作 ${op} 失败: ${text}` }
      }

      await log('info', '1Panel 操作成功', { op })
      if (op.toLowerCase() === 'restart') {
        await log('info', '重启服务指令已发送', { op })
      }
    }

    return { success: true, message: cronjobId && cronjobUrl ? '已拉取代码并发送重启指令' : '服务重启指令已发送' }
  } catch (e: any) {
    logger.error('[Admin] 重启服务异常', e)
    await log('error', '重启服务异常', { message: e.message || 'unknown' }, 500)
    return { success: false, message: e.message || '内部错误' }
  }
}
