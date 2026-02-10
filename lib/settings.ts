import { query, execute } from '@/lib/db'

export async function getSetting(key: string) {
  const rows = await query('SELECT value FROM settings WHERE key = $1 LIMIT 1', [key])
  return rows.length ? String(rows[0].value) : null
}

export async function setSetting(key: string, value: string) {
  await execute('INSERT INTO settings(key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()', [key, value])
}

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed}`
}

export async function getIconfontUrl() {
  const saved = await getSetting('iconfont_url')
  const fallback = '//at.alicdn.com/t/c/font_4737300_lirrln4oop.css'
  return normalizeUrl(saved || fallback)
}
