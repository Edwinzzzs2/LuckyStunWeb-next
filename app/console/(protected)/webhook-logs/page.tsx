"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Menu, RefreshCw, Search, X, Copy, ExternalLink, Info, Code, ShieldCheck, HelpCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationButton, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { fetchConsoleJson } from '@/app/console/_lib/http'
import { useConsoleToast } from '@/app/console/_components/console-toast'
import { useConsoleShell } from '@/app/console/_components/console-shell'

type WebhookLog = {
  id: number
  source: string
  level: string
  message: string
  meta?: any
  status?: number | null
  ip?: string | null
  created_at?: string
}

function formatDate(value?: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function formatMeta(meta?: any) {
  if (!meta) return '-'
  const raw = typeof meta === 'string' ? meta : JSON.stringify(meta)
  if (!raw) return '-'
  return raw
}

function formatIp(value?: string | null) {
  if (!value) return '-'
  if (value.startsWith('::ffff:')) return value.replace('::ffff:', '')
  return value
}

const sourceLabel: Record<string, string> = {
  github: 'GitHub',
  'update-ports': '端口更新',
}

export default function ConsoleWebhookLogsPage() {
  const { push } = useConsoleToast()
  const { openSidebar, setRefreshHandler } = useConsoleShell()
  const didLoadRef = useRef(false)

  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [total, setTotal] = useState(0)

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [source, setSource] = useState('all')
  const [level, setLevel] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setPage(1)
  }, [source, level, keyword, pageSize])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (source && source !== 'all') params.set('source', source)
    if (level && level !== 'all') params.set('level', level)
    if (keyword.trim()) params.set('q', keyword.trim())
    return params.toString()
  }, [page, pageSize, source, level, keyword])

  async function load() {
    setLoading(true)
    try {
      const res = await fetchConsoleJson<{ logs: WebhookLog[]; total: number }>(`/api/webhook/logs?${queryString}`)
      setLogs(res.logs || [])
      setTotal(res.total || 0)
    } catch (e: any) {
      push({ title: '加载日志失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true
    load()
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!didLoadRef.current) return
    load()
  }, [queryString])

  useEffect(() => {
    setRefreshHandler(async () => {
      await load()
    })
    return () => setRefreshHandler(null)
  }, [setRefreshHandler, queryString])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    push({ title: '已复制到剪贴板', tone: 'success' })
  }

  const getFullUrl = (path: string) => {
    if (typeof window === 'undefined') return path
    return `${window.location.origin}${path}`
  }

  return (
    <div className="grid gap-5">
      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:static md:mx-0 md:p-0 md:bg-transparent md:backdrop-blur-none">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-center">
          <div className="grid min-w-0 grid-cols-[auto_1fr] items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl sm:hidden"
              onClick={openSidebar}
              aria-label="打开侧边栏"
              title="打开菜单"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 truncate text-lg font-semibold sm:text-2xl">
                Webhook 日志
                {loading ? <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              </div>
              <div className="text-sm text-muted-foreground">查看 GitHub 与端口更新的主要日志</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl transition-colors"
                  aria-label="查看配置说明"
                  title="查看配置说明"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Webhook 配置说明
                  </DialogTitle>
                  <DialogDescription>
                    配置外部通知或工具自动更新端口的接口信息。
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* GitHub Webhook */}
                    <div className="space-y-4 rounded-2xl border bg-muted/30 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          GitHub 通知接收器
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1.5 text-xs rounded-lg"
                          onClick={() => copyToClipboard(getFullUrl('/api/webhook/github'))}
                        >
                          <Copy className="h-3.5 w-3.5" /> 复制地址
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">请求地址 (URL)</p>
                          <div className="rounded-lg bg-background border p-2 font-mono text-[11px] break-all">
                            {getFullUrl('/api/webhook/github')}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">配置参数</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Payload URL: 填入上述地址</li>
                            <li>Content type: <code>application/json</code></li>
                            <li>Secret: 填写环境变量中的 <code>WEBHOOK_SECRET</code></li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">请求体示例 (JSON Body)</p>
                          <div className="rounded-lg bg-background border p-2 font-mono text-[10px] whitespace-pre-wrap">
{`{
  "ref": "refs/heads/main",
  "pusher": { "name": "user" },
  "commits": [...]
}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Update Ports Webhook */}
                    <div className="space-y-4 rounded-2xl border bg-muted/30 p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                          <Code className="h-4 w-4 text-blue-500" />
                          端口批量更新接口
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1.5 text-xs rounded-lg"
                          onClick={() => copyToClipboard(getFullUrl('/api/webhook/update-ports'))}
                        >
                          <Copy className="h-3.5 w-3.5" /> 复制地址
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">请求地址 (URL)</p>
                          <div className="rounded-lg bg-background border p-2 font-mono text-[11px] break-all">
                            {getFullUrl('/api/webhook/update-ports')}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">请求头 (Headers)</p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Method: <code>POST</code></li>
                            <li>Content-Type: <code>application/json</code></li>
                            <li>Authorization: <code>Bearer &lt;WEBHOOK_SECRET&gt;</code></li>
                          </ul>
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">请求体示例 (JSON Body)</p>
                          <div className="rounded-lg bg-background border p-2 font-mono text-[10px] whitespace-pre-wrap">
{`{
  "domains": ["yourdomain.com"],
  "port": 8080
}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={load}
              disabled={loading}
              aria-label={loading ? '刷新中' : '刷新'}
              title={loading ? '刷新中' : '刷新'}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl p-4">
        <div className="grid gap-3 md:grid-cols-[180px_160px_1fr]">
          <select
            className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="all">全部来源</option>
            <option value="github">GitHub Webhook</option>
            <option value="update-ports">端口更新</option>
          </select>
          <select
            className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="all">全部级别</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索消息或元数据"
              className="h-10 rounded-xl pl-9"
            />
            {keyword ? (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setKeyword('')}
                aria-label="清除搜索"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      {isMobile ? (
        <div className="grid gap-3">
          {logs.length === 0 ? (
            <Card className="rounded-2xl p-6 text-center text-sm text-muted-foreground">暂无日志</Card>
          ) : (
            logs.map((log) => {
              const metaText = formatMeta(log.meta)
              const metaView = metaText.length > 160 ? `${metaText.slice(0, 160)}…` : metaText
              const levelClass =
                log.level === 'error'
                  ? 'text-red-500'
                  : log.level === 'warn'
                    ? 'text-amber-500'
                    : 'text-emerald-500'
              return (
                <Card key={log.id} className="rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{log.message}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{formatDate(log.created_at)}</div>
                    </div>
                    <div className={`shrink-0 text-xs font-semibold ${levelClass}`}>{log.level}</div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">{sourceLabel[log.source] || log.source}</span>
                      <span>状态：{log.status ?? '-'}</span>
                      <span>IP：{formatIp(log.ip)}</span>
                    </div>
                    <div className="break-all">元数据：{metaView}</div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      ) : (
        <Card className="overflow-hidden rounded-none">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-[22%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">时间</TableHead>
                <TableHead className="w-[16%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">来源</TableHead>
                <TableHead className="w-[8%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">级别</TableHead>
                <TableHead className="w-[24%] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">消息</TableHead>
                <TableHead className="w-[10%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">状态</TableHead>
                <TableHead className="w-[10%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">IP</TableHead>
                <TableHead className="w-[10%] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">元数据</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    暂无日志
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const metaText = formatMeta(log.meta)
                  const metaView = metaText.length > 160 ? `${metaText.slice(0, 160)}…` : metaText
                  const levelClass =
                    log.level === 'error'
                      ? 'text-red-500'
                      : log.level === 'warn'
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="w-[22%] text-center text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                      <TableCell className="w-[16%] text-center text-sm whitespace-nowrap">{sourceLabel[log.source] || log.source}</TableCell>
                      <TableCell className={`text-center text-sm font-semibold ${levelClass}`}>{log.level}</TableCell>
                      <TableCell className="min-w-0 text-left">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium" title={log.message}>
                            {log.message}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{log.status ?? '-'}</TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground" title={log.ip || ''}>
                        {formatIp(log.ip)}
                      </TableCell>
                      <TableCell className="min-w-0 text-left text-xs text-muted-foreground" title={metaText}>
                        <div className="truncate">{metaView}</div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground sm:text-sm">
          <span className="sm:inline">共 {total} 条 · 第 {page} / {totalPages} 页</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="hidden h-9 rounded-md border bg-background px-2 text-xs outline-none sm:block sm:text-sm"
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="每页条数"
          >
            <option value="10">10 / 页</option>
            <option value="20">20 / 页</option>
            <option value="50">50 / 页</option>
            <option value="100">100 / 页</option>
          </select>
          <Pagination>
            <PaginationContent>
              <PaginationItem className="hidden sm:block">
                <PaginationButton onClick={() => setPage(1)} disabled={page <= 1}>
                  首页
                </PaginationButton>
              </PaginationItem>
              <PaginationItem>
                <PaginationButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  <span className="hidden sm:inline">上一页</span>
                  <ChevronLeft className="h-4 w-4 sm:hidden" />
                </PaginationButton>
              </PaginationItem>
              <PaginationItem>
                <PaginationButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <span className="hidden sm:inline">下一页</span>
                  <ChevronRight className="h-4 w-4 sm:hidden" />
                </PaginationButton>
              </PaginationItem>
              <PaginationItem className="hidden sm:block">
                <PaginationButton onClick={() => setPage(totalPages)} disabled={page >= totalPages}>
                  末页
                </PaginationButton>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
