"use client"

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { fetchConsoleJson, postJson } from '@/app/console/_lib/http'
import { useConsoleToast } from '@/app/console/_components/console-toast'

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
  return { name: '', en_name: '', parent_id: '0', icon: '', sort_order: '0' }
}

export default function ConsoleCategoriesPage() {
  const { push } = useConsoleToast()

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set())

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryNode | null>(null)
  const [form, setForm] = useState<CategoryFormState>(() => defaultFormState())
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const tree = await fetchConsoleJson<CategoryNode[]>('/api/categories')
      setCategories(tree)
      setExpandedIds((prev) => {
        if (prev.size > 0) return prev
        const all = new Set<number>()
        walkTree(tree, (n) => {
          if (n.children?.length) all.add(n.id)
        })
        return all
      })
    } catch (e: any) {
      push({ title: '加载分类失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(() => flattenVisible(categories, expandedIds), [categories, expandedIds])

  const parentOptions = useMemo(() => flattenForParentOptions(categories, editing?.id), [categories, editing?.id])

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
      sort_order: String(node.sort_order ?? 0),
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
        sort_order: Number(form.sort_order || 0),
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold">分类管理</div>
          <div className="truncate text-sm text-muted-foreground">树形展示，支持新增 / 编辑 / 删除（受父子级与站点引用约束）</div>
        </div>
        <Button onClick={openCreate} disabled={loading} className="rounded-xl">
          <Plus className="h-4 w-4" />
          新增分类
        </Button>
      </div>

      <Card className="overflow-hidden rounded-3xl">
        <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-6">分类</div>
          <div className="col-span-3">标识 / 图标</div>
          <div className="col-span-1 text-right">排序</div>
          <div className="col-span-2 text-right">操作</div>
        </div>
        <div className="divide-y">
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
              <div key={node.id} className="grid grid-cols-12 gap-3 px-6 py-3">
                <div className="col-span-6 flex min-w-0 items-center gap-2">
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
                    >
                      {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  ) : (
                    <div className="h-7 w-7" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{node.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{node.parent_id ? '子分类' : '根分类'}</div>
                  </div>
                </div>

                <div className="col-span-3 flex min-w-0 items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-base">
                    {iconClass ? <i className={iconClass} aria-hidden="true" /> : rawIcon || '📁'}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{node.en_name || '-'}</div>
                    <div className="truncate text-xs text-muted-foreground">ID: {node.id}</div>
                  </div>
                </div>

                <div className="col-span-1 text-right">
                  <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold">{String(node.sort_order ?? 0)}</span>
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEdit(node)}>
                    <Pencil className="h-4 w-4" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                    onClick={() => setDeleteTarget(node)}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </Button>
                </div>
              </div>
            )
          })}
          {rows.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">{loading ? '加载中...' : '暂无分类'}</div>
          ) : null}
        </div>
      </Card>

      <Dialog open={editorOpen} onOpenChange={(open) => {
        if (!open) setEditing(null)
        setEditorOpen(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? '编辑分类' : '新增分类'}</DialogTitle>
            <DialogDescription>{editing ? `ID: ${editing.id}` : '创建一个新的分类节点'}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">分类名称</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="例如：常用推荐" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">标识（en_name）</label>
              <Input value={form.en_name} onChange={(e) => setForm((p) => ({ ...p, en_name: e.target.value }))} placeholder="例如：often" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">父级分类</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
            <div className="grid gap-2">
              <label className="text-sm font-medium">图标（支持 Emoji 或 iconfont）</label>
              <Input value={form.icon} onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))} placeholder="例如：⭐ 或 icon-changyongfuwu" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">排序（数值越小越靠前）</label>
              <Input
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
                type="number"
                inputMode="numeric"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditorOpen(false)}>
              取消
            </Button>
            <Button className="rounded-xl" onClick={submit} disabled={saving}>
              {saving ? '保存中...' : editing ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              className="rounded-xl"
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

