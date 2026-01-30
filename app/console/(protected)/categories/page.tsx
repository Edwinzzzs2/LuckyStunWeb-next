"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Menu, Plus, Trash2, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { fetchConsoleJson, postJson } from '@/app/console/_lib/http'
import { useConsoleToast } from '@/app/console/_components/console-toast'
import { useConsoleShell } from '@/app/console/_components/console-shell'
import { CategoriesMobileList } from '@/app/console/(protected)/categories/_components/categories-mobile-list'

type CategoryNode = {
  id: number
  name: string
  en_name: string | null
  icon: string | null
  parent_id: number | null
  sort_order: number | null
  children: CategoryNode[]
}

type CategoryFormState = {
  name: string
  en_name: string
  parent_id: string
  icon: string
  sort_order: string
}

function walkTree(nodes: CategoryNode[], fn: (n: CategoryNode, depth: number) => void, depth = 0) {
  nodes.forEach((n) => {
    fn(n, depth)
    if (n.children?.length) walkTree(n.children, fn, depth + 1)
  })
}

function flattenForParentOptions(nodes: CategoryNode[], editingId?: number) {
  const list: Array<{ id: number; label: string }> = []
  walkTree(nodes, (n, depth) => {
    if (editingId && n.id === editingId) return
    const prefix = depth > 0 ? `${'—'.repeat(depth)} ` : ''
    list.push({ id: n.id, label: `${prefix}${n.name}${n.en_name ? ` (${n.en_name})` : ''}` })
  })
  return list
}

type FlatRow = { node: CategoryNode; depth: number }

function flattenVisible(nodes: CategoryNode[], expanded: Set<number>) {
  const rows: FlatRow[] = []
  const walk = (n: CategoryNode[], depth: number) => {
    n.forEach((node) => {
      rows.push({ node, depth })
      if (node.children?.length && expanded.has(node.id)) walk(node.children, depth + 1)
    })
  }
  walk(nodes, 0)
  return rows
}

function defaultFormState(): CategoryFormState {
  return { name: '', en_name: '', parent_id: '0', icon: '', sort_order: '' }
}

export default function ConsoleCategoriesPage() {
  const { push } = useConsoleToast()
  const { openSidebar, setRefreshHandler } = useConsoleShell()
  const didLoadRef = useRef(false)

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set())

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryNode | null>(null)
  const [form, setForm] = useState<CategoryFormState>(() => defaultFormState())
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  async function load() {
    setLoading(true)
    try {
      const tree = await fetchConsoleJson<CategoryNode[]>('/api/categories')
      setCategories(tree)
      // 默认不展开
    } catch (e: any) {
      push({ title: '加载分类失败', detail: e?.message || '请稍后重试', tone: 'danger' })
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
    setRefreshHandler(async () => {
      await load()
    })
    return () => setRefreshHandler(null)
  }, [setRefreshHandler])

  const rows = useMemo(() => flattenVisible(categories, expandedIds), [categories, expandedIds])

  const parentOptions = useMemo(() => flattenForParentOptions(categories, editing?.id), [categories, editing?.id])

  const editorBody = (
    <div className="grid gap-6 py-2">
      {/* 基本信息 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-primary/40 pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">基本信息</span>
        </div>
        <div className="grid gap-4 rounded-2xl border bg-muted/30 p-4">
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">分类名称</label>
            <Input
              className="rounded-xl border-none bg-background shadow-sm"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="例如：常用推荐"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">唯一标识 (en_name)</label>
            <Input
              className="rounded-xl border-none bg-background shadow-sm"
              value={form.en_name}
              onChange={(e) => setForm((p) => ({ ...p, en_name: e.target.value }))}
              placeholder="例如：often"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">父级分类</label>
            <select
              className="h-10 w-full rounded-xl border-none bg-background px-3 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
              value={form.parent_id}
              onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
            >
              <option value="0">（无）根分类</option>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={String(opt.id)}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 外观与排序 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-primary/40 pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">外观与排序</span>
        </div>
        <div className="grid gap-4 rounded-2xl border bg-muted/30 p-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">图标 (Emoji 或 iconfont)</label>
            <Input
              className="rounded-xl border-none bg-background shadow-sm"
              value={form.icon}
              onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
              placeholder="例如：⭐ 或 icon-changyongfuwu"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">排序权重 (越小越靠前)</label>
            <Input
              className="rounded-xl border-none bg-background shadow-sm"
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
              type="number"
              inputMode="numeric"
              placeholder="0"
            />
          </div>
        </div>
      </div>
    </div>
  )

  function openCreate() {
    setEditing(null)
    setForm(defaultFormState())
    setEditorOpen(true)
  }

  function openEdit(node: CategoryNode) {
    setEditing(node)
    setForm({
      name: node.name || '',
      en_name: node.en_name || '',
      parent_id: node.parent_id ? String(node.parent_id) : '0',
      icon: node.icon || '',
      sort_order: node.sort_order === null ? '' : String(node.sort_order),
    })
    setEditorOpen(true)
  }

  async function submit() {
    const name = form.name.trim()
    if (!name) {
      push({ title: '请填写必填项', detail: '分类名称不能为空', tone: 'warning' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name,
        en_name: form.en_name.trim() || null,
        icon: form.icon.trim() || null,
        parent_id: form.parent_id && form.parent_id !== '0' ? Number(form.parent_id) : null,
        sort_order: form.sort_order === '' ? null : Number(form.sort_order),
      }
      if (editing) {
        await postJson(`/api/categories/update/${editing.id}`, payload)
        push({ title: '已保存分类', detail: name, tone: 'success' })
      } else {
        await postJson('/api/categories', payload)
        push({ title: '已创建分类', detail: name, tone: 'success' })
      }
      setEditorOpen(false)
      setEditing(null)
      await load()
    } catch (e: any) {
      push({ title: '操作失败', detail: e?.message || '请检查输入', tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await postJson(`/api/categories/delete/${deleteTarget.id}`)
      push({ title: '已删除分类', detail: deleteTarget.name, tone: 'success' })
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      push({ title: '删除失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setDeleting(false)
    }
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
            <div className="truncate text-xl font-semibold sm:text-2xl">分类管理</div>
            <div className="truncate text-sm text-muted-foreground">树形展示，支持新增 / 编辑 / 删除（受父子级与站点引用约束）</div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button onClick={openCreate} disabled={loading} className="rounded-xl" size="icon" title="新增分类">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

      <CategoriesMobileList
        rows={rows}
        expandedIds={expandedIds}
        setExpandedIds={setExpandedIds}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        loading={loading}
      />

      <Card className="hidden overflow-hidden rounded-none sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40%] text-left text-xs uppercase tracking-wide text-muted-foreground">分类</TableHead>
              <TableHead className="w-[20%] text-left text-xs uppercase tracking-wide text-muted-foreground">标识 / 图标</TableHead>
              <TableHead className="w-[10%] pr-10 text-right text-xs uppercase tracking-wide text-muted-foreground">排序</TableHead>
              <TableHead className="w-[15%] pl-10 text-left text-xs uppercase tracking-wide text-muted-foreground">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ node, depth }) => {
              const hasChildren = node.children?.length > 0
              const expanded = expandedIds.has(node.id)
              const rawIcon = String(node.icon || '').trim()
              const iconClass = rawIcon
                ? rawIcon.includes('iconfont')
                  ? rawIcon
                  : rawIcon.startsWith('icon-')
                    ? `iconfont ${rawIcon}`
                    : ''
                : ''
              return (
                <TableRow key={node.id}>
                  <TableCell className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <div style={{ width: depth * 18 }} className="shrink-0" />
                      {hasChildren ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
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
                        <div className="h-7 w-7" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm">{node.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{node.parent_id ? '子分类' : '根分类'}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
                        {iconClass ? <i className={iconClass} aria-hidden="true" /> : rawIcon || '📁'}
                      </span>
                      <div className="truncate text-sm text-muted-foreground">{node.en_name || '-'}</div>
                      <div className="shrink-0 text-[10px] text-muted-foreground/50">#{node.id}</div>
                    </div>
                  </TableCell>

                  <TableCell className="pr-10 text-right">
                    <span className="rounded-lg bg-muted px-2 py-1 text-xs">{String(node.sort_order ?? 0)}</span>
                  </TableCell>

                  <TableCell className="pl-10 text-left">
                    <div className="flex items-center justify-start gap-2">
                      <Button variant="outline" size="icon" className="rounded-xl" onClick={() => openEdit(node)} aria-label="编辑" title="编辑">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                        onClick={() => setDeleteTarget(node)}
                        aria-label="删除"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  {loading ? '加载中...' : '暂无分类'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {isMobile ? (
         <Sheet
           open={editorOpen}
           onOpenChange={(open) => {
             if (!open) setEditing(null)
             setEditorOpen(open)
           }}
         >
           <SheetContent
             side="bottom"
             className="flex h-[92dvh] flex-col p-0 rounded-t-2xl overflow-hidden"
             onOpenAutoFocus={(e) => e.preventDefault()}
             onCloseAutoFocus={(e) => e.preventDefault()}
           >
             <div className="flex-1 overflow-y-auto p-6">
               <SheetHeader>
                 <SheetTitle>{editing ? '编辑分类' : '新增分类'}</SheetTitle>
                 <SheetDescription>{editing ? `ID: ${editing.id}` : '创建一个新的分类节点'}</SheetDescription>
               </SheetHeader>
               <div className="mt-4">{editorBody}</div>
             </div>
             <SheetFooter className="shrink-0 border-t bg-background p-6 pt-4">
              <Button variant="outline" className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={() => setEditorOpen(false)}>
                取消
              </Button>
              <Button className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={submit} disabled={saving}>
                {saving ? '保存中...' : editing ? '保存' : '创建'}
              </Button>
            </SheetFooter>
           </SheetContent>
         </Sheet>
       ) : (
         <Dialog
           open={editorOpen}
           onOpenChange={(open) => {
             if (!open) setEditing(null)
             setEditorOpen(open)
           }}
         >
           <DialogContent
            className="max-w-2xl"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
             <DialogHeader>
               <DialogTitle>{editing ? '编辑分类' : '新增分类'}</DialogTitle>
               <DialogDescription>{editing ? `ID: ${editing.id}` : '创建一个新的分类节点'}</DialogDescription>
             </DialogHeader>

             {editorBody}

             <DialogFooter>
              <Button variant="outline" className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={() => setEditorOpen(false)}>
                取消
              </Button>
              <Button className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={submit} disabled={saving}>
                {saving ? '保存中...' : editing ? '保存' : '创建'}
              </Button>
            </DialogFooter>
           </DialogContent>
         </Dialog>
       )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => {
        if (!open) setDeleteTarget(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除分类</DialogTitle>
            <DialogDescription>将从系统中移除该分类</DialogDescription>
          </DialogHeader>
          <div className="text-sm">
            确认删除分类「{deleteTarget?.name}」？此操作不可撤销。
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              className="h-11 w-full rounded-xl sm:h-9 sm:w-auto"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

