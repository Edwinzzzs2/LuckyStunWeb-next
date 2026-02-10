"use client"

import { useEffect, useMemo, useState } from 'react'
import { Menu, Search, X, RefreshCw, Link as LinkIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useConsoleToast } from '@/app/console/_components/console-toast'
import { useConsoleShell } from '@/app/console/_components/console-shell'
import { fetchConsoleJson, postJson } from '@/app/console/_lib/http'

function normalizeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  return `https://${trimmed}`
}

function parseIconfontFromCss(cssText: string) {
  const names = new Set<string>()
  const re = /\.icon-([a-zA-Z0-9_-]+):before\s*\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cssText))) {
    names.add(m[1])
  }
  return Array.from(names).sort()
}

export default function ConsoleIconsPage() {
  const { push } = useConsoleToast()
  const { openSidebar, setRefreshHandler } = useConsoleShell()
  const [loading, setLoading] = useState(false)
  const [inputUrl, setInputUrl] = useState('//at.alicdn.com/t/c/font_4737300_lirrln4oop.css')
  const [activeUrl, setActiveUrl] = useState('')
  const [icons, setIcons] = useState<string[]>([])
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return icons
    return icons.filter((n) => n.toLowerCase().includes(q))
  }, [icons, keyword])

  async function load(targetUrl?: string) {
    const normalizedUrl = normalizeUrl(targetUrl || activeUrl || inputUrl)
    if (!normalizedUrl) {
      push({ title: '请输入 iconfont 地址', tone: 'warning' })
      return
    }
    try {
      setLoading(true)
      const res = await fetch(normalizedUrl, { cache: 'no-store' })
      const css = await res.text()
      const names = parseIconfontFromCss(css)
      setIcons(names)
      setActiveUrl(normalizedUrl)
      if (names.length === 0) {
        push({ title: '未解析到图标', detail: '检查 URL 是否为 iconfont.css', tone: 'warning' })
      }
    } catch (e: any) {
      push({ title: '加载失败', detail: e?.message || '无法读取 CSS', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRefreshHandler(async () => {
      await load()
    })
    return () => setRefreshHandler(null)
  }, [setRefreshHandler, activeUrl, inputUrl])

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const res = await fetchConsoleJson<{ url: string }>('/api/settings/iconfont')
        if (!alive) return
        const normalized = normalizeUrl(res.url)
        if (normalized) {
          setInputUrl(res.url)
          setActiveUrl(normalized)
          await load(normalized)
        }
      } catch {
        await load()
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!activeUrl) return
    const id = 'iconfont-preview-link'
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = activeUrl
    return () => {
      if (link && link.parentNode) link.parentNode.removeChild(link)
    }
  }, [activeUrl])

  async function copy(name: string) {
    const text = `icon-${name}`
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        push({ title: '已复制图标名称', detail: text, tone: 'success' })
        return
      }
    } catch {}

    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      textarea.setSelectionRange(0, textarea.value.length)
      const ok = document.execCommand('copy')
      document.body.removeChild(textarea)
      if (ok) {
        push({ title: '已复制图标名称', detail: text, tone: 'success' })
      } else {
        push({ title: '复制失败', detail: '请手动复制名称', tone: 'danger' })
      }
    } catch (e: any) {
      push({ title: '复制失败', detail: e?.message || '请手动复制名称', tone: 'danger' })
    }
  }

  return (
    <div className="grid gap-5">
      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:static md:mx-0 md:p-0 md:bg-transparent md:backdrop-blur-none">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-center">
          <div className="grid min-w-0 grid-cols-[auto_1fr] items-start gap-3">
            <Button variant="outline" size="icon" className="rounded-xl sm:hidden" onClick={openSidebar} aria-label="打开侧边栏" title="打开菜单">
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate text-lg font-semibold sm:text-2xl">
                图标管理
                {loading ? <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              </div>
              <div className="text-sm text-muted-foreground">输入 iconfont.css 地址，保存后更新图标与全站样式，点击图标复制名称</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-xl" onClick={() => load()} disabled={loading} aria-label={loading ? '刷新中' : '刷新'} title={loading ? '刷新中' : '刷新'}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="relative min-w-0 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索图标名称" className="min-w-0 pl-9 pr-9" />
          {keyword ? (
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setKeyword('')} aria-label="清除搜索">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={inputUrl} onChange={(e) => setInputUrl(e.target.value)} placeholder="例如：https://at.alicdn.com/t/c/font_xxx.css" className="min-w-0 pl-9" />
          </div>
          <Button
            className="rounded-xl"
            onClick={async () => {
              const raw = inputUrl.trim()
              if (!raw) {
                push({ title: '请输入 iconfont 地址', tone: 'warning' })
                return
              }
              setLoading(true)
              try {
                await postJson('/api/settings/iconfont', { url: raw })
                await load(raw)
                push({ title: '已保存', tone: 'success' })
              } catch (e: any) {
                push({ title: '保存失败', detail: e?.message || '请稍后重试', tone: 'danger' })
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
          >
            保存
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">暂无图标或搜索无结果</Card>
      ) : (
        <div className="grid gap-2">
          <div className="text-xs text-muted-foreground">共 {filtered.length} 个图标</div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
            {filtered.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => copy(name)}
                className="group flex items-center justify-center rounded-xl border bg-card p-3"
                aria-label={`复制 icon-${name}`}
                title={`复制 icon-${name}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
                  <i className={`iconfont icon-${name}`} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
