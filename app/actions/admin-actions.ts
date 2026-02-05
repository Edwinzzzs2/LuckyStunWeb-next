'use server'

import { cookies } from 'next/headers'
import crypto from 'crypto'
import { verifyToken } from '@/lib/auth'
import { logger } from '@/lib/logger'

export async function restartService() {
  try {
    const cookieStore = await cookies()
    const tokenStr = cookieStore.get('token')?.value
    
    if (!tokenStr) {
      return { success: false, message: '未登录' }
    }
    
    const user = verifyToken(tokenStr)
    if (!user || !user.isAdmin) {
      return { success: false, message: '权限不足' }
    }

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
      return { success: false, message: '服务端配置缺失' }
    }

    // 计算 1Panel API Token
    const timestamp = Math.floor(Date.now() / 1000)
    const rawString = `1panel${apiKey}${timestamp}`
    const token = crypto.createHash('md5').update(rawString).digest('hex')

    if (cronjobId && cronjobUrl) {
      logger.info(`[Admin] 触发 1Panel 定时任务: ${cronjobId} by ${user.username}`)
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
        return { success: false, message: `拉取代码失败: ${bodyText}` }
      }

      logger.info(`[Admin] 1Panel 定时任务触发成功，等待延时后重启`, { delayMs })
      if (Number.isFinite(delayMs) && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    // 依次触发操作
    for (const op of operates) {
      logger.info(`[Admin] 触发 1Panel 操作: ${op} by ${user.username}`)
      
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
        return { success: false, message: `操作 ${op} 失败: ${text}` }
      }
    }

    return { success: true, message: cronjobId && cronjobUrl ? '已拉取代码并发送重启指令' : '服务重启指令已发送' }
  } catch (e: any) {
    logger.error('[Admin] 重启服务异常', e)
    return { success: false, message: e.message || '内部错误' }
  }
}
