import { NextRequest, NextResponse } from 'next/server'
import { readJson } from '@/lib/api'
import { query, execute } from '@/lib/db'
import { createWebhookLogger, logApiCall } from '@/lib/logger'

type Body = { port: number | null; domains?: string[]; ids?: number[] }

function isDomainMatch(url: string | null, targetDomains: string[]) {
  if (!url) return false
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    return targetDomains.some((domain) => {
      const escaped = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`^(?:[^.]+\\.)?${escaped}$`)
      return regex.test(hostname)
    })
  } catch {
    return false
  }
}

function updateUrlPort(url: string | null, newPort: number | null) {
  if (!url) return url
  try {
    const urlObj = new URL(url)
    if (newPort === null) {
      urlObj.port = ''
    } else {
      urlObj.port = String(newPort)
    }
    return urlObj.toString()
  } catch {
    return url
  }
}

export async function POST(req: NextRequest) {
  await logApiCall(req)
  const ip = (() => {
    const forwarded = req.headers.get('x-forwarded-for') || ''
    const first = forwarded.split(',')[0]?.trim()
    return first || req.headers.get('x-real-ip') || (req as any).ip || ''
  })()

  const log = createWebhookLogger({ source: 'update-ports', prefix: '[更新端口]', ip })

  await log('info', '收到请求')
  const webhookToken = process.env.WEBHOOK_SECRET
  const bearer = (req.headers.get('authorization') || '').trim()
  const bearerToken = bearer.toLowerCase().startsWith('bearer ') ? bearer.slice(7).trim() : ''
  
  if (!webhookToken) {
    await log('error', '环境变量未配置 Webhook Token', undefined, 500)
    return NextResponse.json({ message: '服务端未配置 Webhook Token' }, { status: 500 })
  }
  
  if (bearerToken !== webhookToken) {
    await log('warn', '未授权访问（Token 无效）', undefined, 401)
    return NextResponse.json({ message: '未授权' }, { status: 401 })
  }

  const { data, error } = await readJson<Body>(req)
  if (error) {
    await log('error', 'JSON 解析失败', { error: (error as any)?.message || 'unknown' }, 400)
    return error
  }

  await log('info', '处理请求参数', { data })

  const rawPort = (data as any)?.port
  const port = rawPort === null ? null : rawPort === undefined ? undefined : Number(rawPort)
  if (port !== null && (port === undefined || !Number.isInteger(port) || port < 0 || port > 65535)) {
    await log('warn', '无效端口', { rawPort }, 400)
    return NextResponse.json({ code: 1, message: '端口号应为 0-65535 之间的整数或 null（去除端口号）' }, { status: 400 })
  }

  const rawDomains = (data as any)?.domains
  const domains = Array.isArray(rawDomains)
    ? rawDomains.filter((x: unknown) => typeof x === 'string').map((x: string) => x.trim()).filter(Boolean)
    : typeof rawDomains === 'string'
      ? [rawDomains.trim()].filter(Boolean)
      : []
  if (domains.length === 0) {
    await log('warn', '未提供域名', undefined, 400)
    return NextResponse.json({ code: 1, message: '域名数组为必填项' }, { status: 400 })
  }
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  for (const domain of domains) {
    if (!domainPattern.test(domain)) {
      await log('warn', '域名格式无效', { domain }, 400)
      return NextResponse.json({ code: 1, message: `无效的域名格式: ${domain}` }, { status: 400 })
    }
  }
  const ids = Array.isArray((data as any)?.ids) ? (data as any).ids : []
  if (ids.length > 0) {
    for (const id of ids) {
      if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        await log('warn', '站点ID无效', { id }, 400)
        return NextResponse.json({ code: 1, message: `无效的站点ID: ${id}` }, { status: 400 })
      }
    }
  }
  
  try {
    const sitesToUpdate = await query('SELECT id, url, backup_url, internal_url, logo, category_id FROM sites WHERE update_port_enabled = TRUE')
    if (sitesToUpdate.length === 0) {
      await log('info', '没有开启自动更新端口的站点', undefined, 404)
      return NextResponse.json({ code: 1, message: '没有找到符合条件的网站' }, { status: 404 })
    }
    const filtered = sitesToUpdate.filter((site) => {
      const hasIds = ids.length > 0
      const hasDomains = domains.length > 0
      if (!hasIds && !hasDomains) return false
      const idMatched = hasIds ? ids.includes(site.id) : true
      const domainMatched = hasDomains
        ? isDomainMatch(site.url, domains) || isDomainMatch(site.backup_url, domains) || isDomainMatch(site.internal_url, domains) || isDomainMatch(site.logo, domains)
        : true
      return idMatched && domainMatched
    })
    if (filtered.length === 0) {
      await log('info', '未找到匹配站点', { domains, ids }, 200)
      return NextResponse.json({ code: 0, message: '没有找到匹配的站点需要更新', matched_count: 0, needs_update_count: 0, updated_count: 0, failed_count: 0 })
    }
    let updatedCount = 0
    const failedUpdates: Array<{ id: number; error: string }> = []
    const categoriesUpdated = new Set<number>()
    let needsUpdateCount = 0
    for (const site of filtered) {
      const updates: string[] = []
      const params: any[] = []
      let hasChanges = false
      let placeholderIndex = 1
      if (site.url && isDomainMatch(site.url, domains)) {
        const newUrl = updateUrlPort(site.url, port ?? null)
        if (newUrl !== site.url) {
          updates.push(`url = $${placeholderIndex}`)
          placeholderIndex += 1
          params.push(newUrl)
          hasChanges = true
        }
      }
      if (site.backup_url && isDomainMatch(site.backup_url, domains)) {
        const newBackupUrl = updateUrlPort(site.backup_url, port ?? null)
        if (newBackupUrl !== site.backup_url) {
          updates.push(`backup_url = $${placeholderIndex}`)
          placeholderIndex += 1
          params.push(newBackupUrl)
          hasChanges = true
        }
      }
      if (site.internal_url && isDomainMatch(site.internal_url, domains)) {
        const newInternalUrl = updateUrlPort(site.internal_url, port ?? null)
        if (newInternalUrl !== site.internal_url) {
          updates.push(`internal_url = $${placeholderIndex}`)
          placeholderIndex += 1
          params.push(newInternalUrl)
          hasChanges = true
        }
      }
      if (site.logo && isDomainMatch(site.logo, domains)) {
        const newLogo = updateUrlPort(site.logo, port ?? null)
        if (newLogo !== site.logo) {
          updates.push(`logo = $${placeholderIndex}`)
          placeholderIndex += 1
          params.push(newLogo)
          hasChanges = true
        }
      }
      if (hasChanges) {
        needsUpdateCount += 1
        try {
          const idPlaceholder = `$${placeholderIndex}`
          params.push(site.id)
          await execute(`UPDATE sites SET ${updates.join(', ')} WHERE id = ${idPlaceholder}`, params)
          updatedCount += 1
          categoriesUpdated.add(site.category_id)
        } catch (e: any) {
          await log('error', '更新站点失败', { id: site.id, error: e?.code || e?.message || 'unknown' }, 500)
          failedUpdates.push({ id: site.id, error: e?.code || e?.message || 'unknown' })
        }
      }
    }
    const matchCriteria: string[] = []
    if (domains.length > 0) matchCriteria.push(`域名 [${domains.join(', ')}]`)
    if (ids.length > 0) matchCriteria.push(`ID [${ids.join(', ')}]`)
    const portMessage = port === null ? '去除端口号' : `端口号为 ${port}`
    
    await log('info', '更新汇总', {
      matched: filtered.length,
      needs_update: needsUpdateCount,
      updated: updatedCount,
      failed: failedUpdates.length,
      domains,
      ids,
      port,
    })
    
    if (failedUpdates.length > 0) {
      await log('error', '更新部分失败', { failed: failedUpdates.slice(0, 20) }, 500)
      return NextResponse.json(
        {
          code: 1,
          message: `通过 ${matchCriteria.join(' 和 ')} 匹配到 ${filtered.length} 个网站，尝试更新其中 ${needsUpdateCount} 个，成功 ${updatedCount} 个，失败 ${failedUpdates.length} 个。`,
          matched_count: filtered.length,
          needs_update_count: needsUpdateCount,
          updated_count: updatedCount,
          failed_count: failedUpdates.length,
          updated_categories: Array.from(categoriesUpdated),
        },
        { status: 500 }
      )
    }
    await log('info', '更新成功', { updated: updatedCount, matched: filtered.length }, 200)
    return NextResponse.json({
      code: 0,
      message: `通过 ${matchCriteria.join(' 和 ')} 匹配到 ${filtered.length} 个网站，成功为其中 ${updatedCount} 个网站${portMessage}`,
      matched_count: filtered.length,
      needs_update_count: needsUpdateCount,
      updated_count: updatedCount,
      failed_count: 0,
      updated_categories: Array.from(categoriesUpdated),
    })
  } catch (e: any) {
    await log('error', '数据库错误', { error: e?.message || 'unknown' }, 500)
    return NextResponse.json({ message: '更新端口失败' }, { status: 500 })
  }
}
