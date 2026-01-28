"use client"

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react'

type CategoryNode = {
  id: number
  name: string
  en_name: string | null
  icon: string | null
  parent_id: number | null
  sort_order: number | null
  children: CategoryNode[]
}

export function CategoriesMobileList({
  rows,
  expandedIds,
  setExpandedIds,
  onEdit,
  onDelete,
  loading,
}: {
  rows: Array<{ node: CategoryNode; depth: number }>
  expandedIds: Set<number>
  setExpandedIds: (updater: (prev: Set<number>) => Set<number>) => void
  onEdit: (node: CategoryNode) => void
  onDelete: (node: CategoryNode) => void
  loading: boolean
}) {
  return (
    <div className="grid gap-3 sm:hidden">
      <Card className="w-full min-w-0 rounded-3xl">
        <div className="min-w-0 divide-y">
          {rows.map(({ node, depth }) => {
            const hasChildren = node.children?.length > 0
            const expanded = expandedIds.has(node.id)
            return (
              <div key={node.id} className="relative box-border w-full min-w-0 max-w-full overflow-hidden px-4 py-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {hasChildren ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => {
                          setExpandedIds((prev) => {
                            const next = new Set(prev)
                            if (next.has(node.id)) next.delete(node.id)
                            else next.add(node.id)
                            return next
                          })
                        }}
                        aria-label={expanded ? '收起' : '展开'}
                        title={expanded ? '收起' : '展开'}
                      >
                        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    ) : (
                      <div className="h-7 w-7 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{node.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{node.en_name || '-'}</span>
                        <span className="shrink-0">ID: {node.id}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{node.parent_id ? '子分类' : '根分类'}</span>
                        <span className="shrink-0">排序: {String(node.sort_order ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => onEdit(node)} aria-label="编辑" title="编辑">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                      onClick={() => onDelete(node)}
                      aria-label="删除"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {expanded && node.children?.length ? (
                  <div className="mt-3 text-xs text-muted-foreground">子项：{node.children.length}</div>
                ) : null}
              </div>
            )
          })}
          {rows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">{loading ? '加载中...' : '暂无分类'}</div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
