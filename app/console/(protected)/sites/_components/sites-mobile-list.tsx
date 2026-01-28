"use client"

import { Eye, EyeOff, ExternalLink, Loader2, Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

import { SiteLogo } from './site-logo'
import type { SiteRow } from './types'

export function SitesMobileList({
  items,
  categoryName,
  loading,
  isRowBusy,
  onToggleVisible,
  onToggleUpdatePort,
  onEdit,
  onDelete,
}: {
  items: SiteRow[]
  categoryName: (categoryId: number) => string
  loading: boolean
  isRowBusy: (id: number) => boolean
  onToggleVisible: (site: SiteRow, checked: boolean) => void
  onToggleUpdatePort: (site: SiteRow, checked: boolean) => void
  onEdit: (site: SiteRow) => void
  onDelete: (site: SiteRow) => void
}) {
  return (
    <div className="grid min-w-0 gap-3 sm:hidden">
      <Card className="w-full min-w-0 rounded-3xl">
        <div className="min-w-0 divide-y">
          {items.map((s) => (
            <div key={s.id} className="relative box-border w-full min-w-0 max-w-full overflow-hidden px-4 py-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <SiteLogo logo={s.logo} title={s.title} />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="truncate text-sm font-semibold">{s.title}</div>
                      <div className="shrink-0 text-xs text-muted-foreground">#{s.id}</div>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.desc || '-'}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{categoryName(s.category_id)}</span>
                      <span className="shrink-0">排序: {String(s.sort_order ?? 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {s.is_visible ? (
                    <Eye className="h-4 w-4 text-emerald-500" aria-label="显示" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" aria-label="隐藏" />
                  )}
                  {isRowBusy(s.id) ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl"
                    onClick={() => onEdit(s)}
                    disabled={isRowBusy(s.id)}
                    aria-label="编辑"
                    title="编辑"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                    onClick={() => onDelete(s)}
                    disabled={isRowBusy(s.id)}
                    aria-label="删除"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid gap-1.5">
                {[s.url, s.backup_url, s.internal_url]
                  .map((u, idx) => ({ u, label: idx === 0 ? '主链接' : idx === 1 ? '备用' : '内网' }))
                  .filter((x) => Boolean(x.u))
                  .map(({ u, label }) => (
                    <a
                      key={label}
                      href={u as string}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full min-w-0 items-center gap-2 text-sm text-primary"
                    >
                      <span className="w-10 shrink-0 text-xs text-muted-foreground">{label}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{u}</span>
                    </a>
                  ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>端口更新</span>
                  <Switch
                    checked={s.update_port_enabled}
                    onCheckedChange={(checked) => onToggleUpdatePort(s, checked)}
                    disabled={isRowBusy(s.id)}
                  />
                </label>
              </div>
            </div>
          ))}
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">{loading ? '加载中...' : '暂无站点'}</div>
          ) : null}
        </div>
      </Card>

    </div>
  )
}
