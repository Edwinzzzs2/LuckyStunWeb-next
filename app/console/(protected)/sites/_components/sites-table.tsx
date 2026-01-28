"use client"

import type { MouseEvent as ReactMouseEvent } from 'react'
import { ExternalLink, Loader2, Pencil, RefreshCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { SiteLogo } from './site-logo'
import type { SiteRow, TableColKey } from './types'

export function SitesTable({
  items,
  selected,
  allChecked,
  someChecked,
  toggleAll,
  toggleOne,
  loading,
  isRowBusy,
  onToggleVisible,
  onEdit,
  onDelete,
  tableColWidth,
  tableTotalWidth,
  resizeStart,
  categoryName,
}: {
  items: SiteRow[]
  selected: Set<number>
  allChecked: boolean
  someChecked: boolean
  toggleAll: () => void
  toggleOne: (id: number) => void
  loading: boolean
  isRowBusy: (id: number) => boolean
  onToggleVisible: (site: SiteRow, checked: boolean) => void
  onEdit: (site: SiteRow) => void
  onDelete: (site: SiteRow) => void
  tableColWidth: Record<TableColKey, number>
  tableTotalWidth: number
  resizeStart: (key: TableColKey, e: ReactMouseEvent) => void
  categoryName: (categoryId: number) => string
}) {
  return (
    <div className="hidden sm:block">
      <div className="overflow-x-auto">
        <Table className="table-fixed" style={{ width: tableTotalWidth }}>
          <TableHeader>
          <TableRow>
            <TableHead className="text-center" style={{ width: tableColWidth.select }}>
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => {
                  if (!el) return
                  el.indeterminate = !allChecked && someChecked
                }}
                onChange={toggleAll}
                disabled={loading}
                aria-label="全选"
              />
            </TableHead>

            <TableHead className="group relative text-center" style={{ width: tableColWidth.logo }}>
              图标
              <div className="pointer-events-none absolute right-0 top-0 h-12 w-px bg-border/70 group-hover:bg-primary/60" />
              <div
                className="absolute -right-2 top-0 h-12 w-4 cursor-col-resize"
                onMouseDown={(e) => resizeStart('logo', e)}
                aria-label="调整图标列宽"
              />
            </TableHead>

            <TableHead className="group relative" style={{ width: tableColWidth.info }}>
              站点信息
              <div className="pointer-events-none absolute right-0 top-0 h-12 w-px bg-border/70 group-hover:bg-primary/60" />
              <div
                className="absolute -right-2 top-0 h-12 w-4 cursor-col-resize"
                onMouseDown={(e) => resizeStart('info', e)}
                aria-label="调整站点信息列宽"
              />
            </TableHead>

            <TableHead className="group relative" style={{ width: tableColWidth.links }}>
              链接
              <div className="pointer-events-none absolute right-0 top-0 h-12 w-px bg-border/70 group-hover:bg-primary/60" />
              <div
                className="absolute -right-2 top-0 h-12 w-4 cursor-col-resize"
                onMouseDown={(e) => resizeStart('links', e)}
                aria-label="调整链接列宽"
              />
            </TableHead>

            <TableHead className="group relative text-center" style={{ width: tableColWidth.updatePort }}>
              端口更新
              <div className="pointer-events-none absolute right-0 top-0 h-12 w-px bg-border/70 group-hover:bg-primary/60" />
              <div
                className="absolute -right-2 top-0 h-12 w-4 cursor-col-resize"
                onMouseDown={(e) => resizeStart('updatePort', e)}
                aria-label="调整端口更新列宽"
              />
            </TableHead>

            <TableHead className="group relative text-center" style={{ width: tableColWidth.visibility }}>
              导航显隐
              <div className="pointer-events-none absolute right-0 top-0 h-12 w-px bg-border/70 group-hover:bg-primary/60" />
              <div
                className="absolute -right-2 top-0 h-12 w-4 cursor-col-resize"
                onMouseDown={(e) => resizeStart('visibility', e)}
                aria-label="调整导航显隐列宽"
              />
            </TableHead>

            <TableHead className="text-left" style={{ width: tableColWidth.actions }}>
              操作
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="text-center" style={{ width: tableColWidth.select }}>
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggleOne(s.id)}
                  disabled={loading}
                  aria-label={`选择 ${s.title}`}
                />
              </TableCell>
              <TableCell className="text-center" style={{ width: tableColWidth.logo }}>
                <div className="flex items-center justify-center">
                  <SiteLogo logo={s.logo} title={s.title} />
                </div>
              </TableCell>
              <TableCell className="min-w-0" style={{ width: tableColWidth.info }}>
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="truncate text-sm font-medium">{s.title}</div>
                    <div className="shrink-0 text-xs text-muted-foreground">#{s.id}</div>
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0">{categoryName(s.category_id)}</span>
                    <span className="truncate">{s.desc || '-'}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="min-w-0" style={{ width: tableColWidth.links }}>
                <div className="flex min-w-0 items-center gap-2">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-w-0 flex-1 items-center gap-1 truncate text-sm text-primary hover:underline"
                    title="主链接"
                  >
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{s.url}</span>
                  </a>
                  {s.backup_url ? (
                    <a
                      href={s.backup_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                      title={s.backup_url}
                    >
                      备
                    </a>
                  ) : null}
                  {s.internal_url ? (
                    <a
                      href={s.internal_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                      title={s.internal_url}
                    >
                      内
                    </a>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-center" style={{ width: tableColWidth.updatePort }}>
                {s.update_port_enabled ? (
                  <span className="text-xs text-muted-foreground">同步</span>
                ) : (
                  <span className="text-xs text-muted-foreground/30">-</span>
                )}
              </TableCell>
              <TableCell className="text-center" style={{ width: tableColWidth.visibility }}>
                <div className="flex items-center justify-center gap-2">
                  <Switch
                    checked={s.is_visible}
                    onCheckedChange={(checked) => onToggleVisible(s, checked)}
                    disabled={isRowBusy(s.id) || loading}
                    aria-label="导航显隐"
                  />
                  {isRowBusy(s.id) ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                </div>
              </TableCell>
              <TableCell className="text-left" style={{ width: tableColWidth.actions }}>
                <div className="flex items-center justify-start gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => onEdit(s)}
                    disabled={isRowBusy(s.id) || loading}
                    aria-label="编辑"
                    title="编辑"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                    onClick={() => onDelete(s)}
                    disabled={isRowBusy(s.id) || loading}
                    aria-label="删除"
                    title="删除"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}

          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                {loading ? '加载中...' : '暂无站点'}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  </div>
)
}
