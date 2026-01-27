"use client"

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Plus, Trash2, Pencil, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { cn } from '@/lib/utils'

type CategoryFlat = { id: number; name: string }

type SiteRow = {
  id: number
  category_id: number
  url: string
  backup_url: string | null
  internal_url: string | null
  logo: string | null
  title: string
  desc: string | null
  sort_order: number | null
  is_visible: boolean
  update_port_enabled: boolean
}

type SiteFormState = {
  category_id: string
  logo: string
  title: string
  desc: string
  url: string
  backup_url: string
  internal_url: string
  sort_order: string
  is_visible: boolean
  update_port_enabled: boolean
}

function toForm(site?: SiteRow, defaultCategoryId?: number): SiteFormState {
  return {
    category_id: site ? String(site.category_id) : String(defaultCategoryId || 0),
    logo: site?.logo || '',
    title: site?.title || '',
    desc: site?.desc || '',
    url: site?.url || '',
    backup_url: site?.backup_url || '',
    internal_url: site?.internal_url || '',
    sort_order: String(site?.sort_order ?? 0),
    is_visible: site?.is_visible ?? true,
    update_port_enabled: site?.update_port_enabled ?? true,
  }
}

export default function ConsoleSitesPage() {
  const { push } = useConsoleToast()

  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState<SiteRow[]>([])
  const [categories, setCategories] = useState<CategoryFlat[]>([])

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected] = useState<Set<number>>(() => new Set())

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<SiteRow | null>(null)
  const [form, setForm] = useState<SiteFormState>(() => toForm())
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<SiteRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [batchOpen, setBatchOpen] = useState(false)
  const [batchCategoryId, setBatchCategoryId] = useState('')
  const [batchVisible, setBatchVisible] = useState<'keep' | 'show' | 'hide'>('keep')
  const [batchSaving, setBatchSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [web, cats] = await Promise.all([
        fetchConsoleJson<SiteRow[]>('/api/sites'),
        fetchConsoleJson<CategoryFlat[]>('/api/categories/flat'),
      ])
      setSites(web)
      setCategories(cats)
    } catch (e: any) {
      push({ title: '加载数据失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const categoryNameMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name] as const)), [categories])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sites.filter((s) => {
      if (categoryFilter !== 'all' && String(s.category_id) !== categoryFilter) return false
      if (!q) return true
      const hay = `${s.title} ${s.desc || ''} ${s.url} ${s.backup_url || ''} ${s.internal_url || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [sites, query, categoryFilter])

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.id))
  const someChecked = filtered.some((s) => selected.has(s.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        filtered.forEach((s) => next.delete(s.id))
      } else {
        filtered.forEach((s) => next.add(s.id))
      }
      return next
    })
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openCreate() {
    setEditing(null)
    const firstCategoryId = categories[0]?.id
    setForm(toForm(undefined, firstCategoryId))
    setEditorOpen(true)
  }

  function openEdit(site: SiteRow) {
    setEditing(site)
    setForm(toForm(site))
    setEditorOpen(true)
  }

  async function save() {
    const title = form.title.trim()
    const url = form.url.trim()
    const categoryId = Number(form.category_id)
    if (!title || !url || !Number.isInteger(categoryId) || categoryId <= 0) {
      push({ title: '请填写必填项', detail: '分类、标题、URL 为必填项', tone: 'warning' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        category_id: categoryId,
        logo: form.logo.trim() || null,
        title,
        desc: form.desc.trim() || null,
        url,
        backup_url: form.backup_url.trim() || null,
        internal_url: form.internal_url.trim() || null,
        sort_order: Number(form.sort_order || 0),
        is_visible: form.is_visible,
        update_port_enabled: form.update_port_enabled,
      }
      if (editing) {
        await postJson(`/api/sites/update/${editing.id}`, payload)
        push({ title: '已更新站点', detail: title, tone: 'success' })
      } else {
        await postJson('/api/sites', payload)
        push({ title: '已创建站点', detail: title, tone: 'success' })
      }
      setEditorOpen(false)
      setEditing(null)
      await load()
    } catch (e: any) {
      push({ title: '保存失败', detail: e?.message || '请检查输入', tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  async function updateSite(site: SiteRow, patch: Partial<Pick<SiteRow, 'is_visible' | 'update_port_enabled' | 'category_id'>>) {
    try {
      const payload = {
        category_id: patch.category_id ?? site.category_id,
        url: site.url,
        backup_url: site.backup_url,
        internal_url: site.internal_url,
        logo: site.logo,
        title: site.title,
        desc: site.desc,
        sort_order: site.sort_order ?? 0,
        is_visible: patch.is_visible ?? site.is_visible,
        update_port_enabled: patch.update_port_enabled ?? site.update_port_enabled,
      }
      await postJson(`/api/sites/update/${site.id}`, payload)
      await load()
    } catch (e: any) {
      push({ title: '更新失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await postJson(`/api/sites/delete/${deleteTarget.id}`)
      push({ title: '已删除站点', detail: deleteTarget.title, tone: 'success' })
      setDeleteTarget(null)
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
      await load()
    } catch (e: any) {
      push({ title: '删除失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setDeleting(false)
    }
  }

  async function submitBatch() {
    const siteIds = Array.from(selected)
    if (siteIds.length === 0) return
    const payload: any = { site_ids: siteIds }
    if (batchCategoryId) payload.category_id = Number(batchCategoryId)
    if (batchVisible !== 'keep') payload.is_visible = batchVisible === 'show'
    if (!payload.category_id && payload.is_visible === undefined) {
      push({ title: '请选择至少一个更新项', detail: '批量操作需要选择分类或显隐状态', tone: 'warning' })
      return
    }
    setBatchSaving(true)
    try {
      const res = await postJson<{ message?: string }>('/api/sites/batch-update-category', payload)
      push({ title: '批量操作成功', detail: res?.message || `已更新 ${siteIds.length} 个站点`, tone: 'success' })
      setBatchOpen(false)
      setBatchCategoryId('')
      setBatchVisible('keep')
      setSelected(new Set())
      await load()
    } catch (e: any) {
      push({ title: '批量操作失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setBatchSaving(false)
    }
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold">网站管理</div>
          <div className="truncate text-sm text-muted-foreground">支持增删改、显隐开关、批量改分类/显隐、搜索过滤</div>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 ? (
            <Button variant="outline" className="rounded-xl" onClick={() => setBatchOpen(true)}>
              批量操作（{selected.size}）
            </Button>
          ) : null}
          <Button onClick={openCreate} disabled={loading} className="rounded-xl">
            <Plus className="h-4 w-4" />
            新增站点
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="按标题 / URL 搜索"
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-64">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">全部分类</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {query || categoryFilter !== 'all' ? (
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              setQuery('')
              setCategoryFilter('all')
            }}
          >
            <X className="h-4 w-4" />
            清除过滤
          </Button>
        ) : null}
      </div>

      <Card className="overflow-hidden rounded-3xl">
        <div className="grid grid-cols-[44px_64px_78px_84px_110px_minmax(180px,1.4fr)_minmax(220px,2fr)_minmax(220px,2fr)_minmax(220px,2fr)_140px] gap-3 border-b bg-muted/40 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={allChecked}
              ref={(el) => {
                if (!el) return
                el.indeterminate = !allChecked && someChecked
              }}
              onChange={toggleAll}
            />
          </div>
          <div>ID</div>
          <div className="text-center">显隐</div>
          <div className="text-center">端口更新</div>
          <div>分类</div>
          <div>标题 / 描述</div>
          <div>主链接</div>
          <div>备用链接</div>
          <div>内网链接</div>
          <div className="text-right">操作</div>
        </div>
        <div className="divide-y">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[44px_64px_78px_84px_110px_minmax(180px,1.4fr)_minmax(220px,2fr)_minmax(220px,2fr)_minmax(220px,2fr)_140px] gap-3 px-6 py-3"
            >
              <div className="flex items-center justify-center">
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} />
              </div>
              <div className="text-sm font-semibold">{s.id}</div>
              <div className="flex items-center justify-center">
                <Switch checked={s.is_visible} onCheckedChange={(checked) => updateSite(s, { is_visible: checked })} />
              </div>
              <div className="flex items-center justify-center">
                <Switch
                  checked={s.update_port_enabled}
                  onCheckedChange={(checked) => updateSite(s, { update_port_enabled: checked })}
                />
              </div>
              <div className="truncate text-sm text-muted-foreground">{categoryNameMap.get(s.category_id) || `#${s.category_id}`}</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{s.title}</div>
                <div className="truncate text-xs text-muted-foreground">{s.desc || '-'}</div>
              </div>
              {[s.url, s.backup_url, s.internal_url].map((u, idx) => (
                <div key={idx} className="min-w-0">
                  {u ? (
                    <a
                      href={u}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1 truncate text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="truncate">{u}</span>
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openEdit(s)}>
                  <Pencil className="h-4 w-4" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                  onClick={() => setDeleteTarget(s)}
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">{loading ? '加载中...' : '暂无站点'}</div>
          ) : null}
        </div>
      </Card>

      <Dialog open={editorOpen} onOpenChange={(open) => {
        if (!open) setEditing(null)
        setEditorOpen(open)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑站点' : '新增站点'}</DialogTitle>
            <DialogDescription>{editing ? `ID: ${editing.id}` : '创建一个新的站点'}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">分类</label>
              <select
                className={cn('h-10 w-full rounded-md border bg-background px-3 text-sm', !form.category_id || form.category_id === '0' ? 'text-muted-foreground' : '')}
                value={form.category_id}
                onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
              >
                <option value="0">请选择分类</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">标题</label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="例如：memos" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Logo（可选）</label>
                <Input value={form.logo} onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">描述（可选）</label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={3}
                value={form.desc}
                onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
                placeholder="一句话描述"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">主链接（url）</label>
              <Input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://example.com" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">备用链接（backup_url，可选）</label>
              <Input value={form.backup_url} onChange={(e) => setForm((p) => ({ ...p, backup_url: e.target.value }))} placeholder="https://backup.example.com" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">内网链接（internal_url，可选）</label>
              <Input value={form.internal_url} onChange={(e) => setForm((p) => ({ ...p, internal_url: e.target.value }))} placeholder="http://192.168.1.2:8080" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">排序</label>
                <Input value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} type="number" />
              </div>
              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <div className="text-sm font-medium">显隐</div>
                  <div className="text-xs text-muted-foreground">控制导航页展示</div>
                </div>
                <Switch checked={form.is_visible} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_visible: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <div>
                  <div className="text-sm font-medium">端口更新</div>
                  <div className="text-xs text-muted-foreground">用于批量更新端口</div>
                </div>
                <Switch
                  checked={form.update_port_enabled}
                  onCheckedChange={(checked) => setForm((p) => ({ ...p, update_port_enabled: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditorOpen(false)}>
              取消
            </Button>
            <Button className="rounded-xl" onClick={save} disabled={saving}>
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
            <DialogTitle>删除站点</DialogTitle>
            <DialogDescription>将从系统中移除该站点</DialogDescription>
          </DialogHeader>
          <div className="text-sm">确认删除站点「{deleteTarget?.title}」？此操作不可撤销。</div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={confirmDelete} disabled={deleting}>
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchOpen} onOpenChange={(open) => {
        if (!open) {
          setBatchCategoryId('')
          setBatchVisible('keep')
        }
        setBatchOpen(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量操作</DialogTitle>
            <DialogDescription>已选择 {selected.size} 个站点</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">批量改分类（可选）</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={batchCategoryId}
                onChange={(e) => setBatchCategoryId(e.target.value)}
              >
                <option value="">不修改</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">批量改显隐（可选）</label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={batchVisible}
                onChange={(e) => setBatchVisible(e.target.value as any)}
              >
                <option value="keep">不修改</option>
                <option value="show">设为显示</option>
                <option value="hide">设为隐藏</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setBatchOpen(false)}>
              取消
            </Button>
            <Button className="rounded-xl" onClick={submitBatch} disabled={batchSaving}>
              {batchSaving ? '提交中...' : '确认提交'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

