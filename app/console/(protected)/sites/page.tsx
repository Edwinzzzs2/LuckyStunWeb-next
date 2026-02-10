"use client"

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Layers, Loader2, Menu, Plus, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Pagination, PaginationButton, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { fetchConsoleJson, postJson } from '@/app/console/_lib/http'
import { useConsoleToast } from '@/app/console/_components/console-toast'
import { SitesMobileList } from '@/app/console/(protected)/sites/_components/sites-mobile-list'
import { SitesTable } from '@/app/console/(protected)/sites/_components/sites-table'
import { SiteEditorDialog } from '@/app/console/(protected)/sites/_components/site-editor-dialog'
import { SiteDeleteDialog } from '@/app/console/(protected)/sites/_components/site-delete-dialog'
import { SitesBatchDialog } from '@/app/console/(protected)/sites/_components/sites-batch-dialog'
import type { CategoryFlat, SiteFormState, SiteRow, TableColKey } from '@/app/console/(protected)/sites/_components/types'
import { toForm } from '@/app/console/(protected)/sites/_components/types'
import { useConsoleShell } from '@/app/console/_components/console-shell'

export default function ConsoleSitesPage() {
  const { push } = useConsoleToast()
  const { openSidebar, setRefreshHandler } = useConsoleShell()
  const didLoadRef = useRef(false)

  const [loading, setLoading] = useState(false)
  const [sites, setSites] = useState<SiteRow[]>([])
  const [categories, setCategories] = useState<CategoryFlat[]>([])

  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selected, setSelected] = useState<Set<number>>(() => new Set())

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [tableColWidth, setTableColWidth] = useState<Record<TableColKey, number>>(() => ({
    select: 44,
    logo: 56,
    info: 240,
    links: 360,
    updatePort: 80,
    visibility: 80,
    actions: 140,
  }))

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

  const [rowBusy, setRowBusy] = useState<Set<number>>(() => new Set())

  function isRowBusy(id: number) {
    return rowBusy.has(id)
  }

  function setOneRowBusy(id: number, busy: boolean) {
    setRowBusy((prev) => {
      const next = new Set(prev)
      if (busy) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function readSavedWidths(): Record<TableColKey, number> | null {
    try {
      const raw = window.localStorage.getItem('console-sites-table-widths')
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return null
      const next: Record<TableColKey, number> = {
        select: Number(parsed.select) || 44,
        logo: Number(parsed.logo) || 56,
        info: Number(parsed.info) || 320,
        links: Number(parsed.links) || 420,
        updatePort: Number(parsed.updatePort) || 80,
        visibility: Number(parsed.visibility) || 80,
        actions: Number(parsed.actions) || 140,
      }
      return next
    } catch {
      return null
    }
  }

  useEffect(() => {
    const saved = readSavedWidths()
    if (saved) setTableColWidth(saved)
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('console-sites-table-widths', JSON.stringify(tableColWidth))
    } catch {}
  }, [tableColWidth])

  function resizeStart(key: TableColKey, e: ReactMouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = tableColWidth[key]

    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX
      const min: Record<TableColKey, number> = {
        select: 44,
        logo: 56,
        info: 180,
        links: 200,
        updatePort: 60,
        visibility: 60,
        actions: 120,
      }
      const next = Math.max(min[key], Math.round(startWidth + delta))
      setTableColWidth((prev) => ({ ...prev, [key]: next }))
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const tableTotalWidth = useMemo(
    () => Object.values(tableColWidth).reduce((sum, n) => sum + (Number.isFinite(n) ? n : 0), 0),
    [tableColWidth]
  )

  async function loadAll() {
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

  async function reloadSites() {
    try {
      const web = await fetchConsoleJson<SiteRow[]>('/api/sites')
      setSites(web)
    } catch (e: any) {
      push({ title: '刷新站点失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    }
  }

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true
    loadAll()
  }, [])

  useEffect(() => {
    setRefreshHandler(async () => {
      await loadAll()
    })
    return () => setRefreshHandler(null)
  }, [setRefreshHandler])

  const categoryNameMap = useMemo(() => new Map(categories.map((c) => [c.id, c.name] as const)), [categories])
  const categoryName = useMemo(
    () => (categoryId: number) => categoryNameMap.get(categoryId) || `#${categoryId}`,
    [categoryNameMap]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sites.filter((s) => {
      if (categoryFilter !== 'all' && String(s.category_id) !== categoryFilter) return false
      if (!q) return true
      const hay = `${s.title} ${s.desc || ''} ${s.url} ${s.backup_url || ''} ${s.internal_url || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [sites, query, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages))
  }, [totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  const allChecked = pageItems.length > 0 && pageItems.every((s) => selected.has(s.id))
  const someChecked = pageItems.some((s) => selected.has(s.id))

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allChecked) {
        pageItems.forEach((s) => next.delete(s.id))
      } else {
        pageItems.forEach((s) => next.add(s.id))
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
        sort_order: form.sort_order === '' ? null : Number(form.sort_order),
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
      await reloadSites()
    } catch (e: any) {
      push({ title: '保存失败', detail: e?.message || '请检查输入', tone: 'danger' })
    } finally {
      setSaving(false)
    }
  }

  async function updateSite(site: SiteRow, patch: Partial<Pick<SiteRow, 'is_visible' | 'update_port_enabled' | 'category_id'>>) {
    if (isRowBusy(site.id)) return
    setOneRowBusy(site.id, true)
    setSites((prev) => prev.map((s) => (s.id === site.id ? { ...s, ...patch } : s)))
    try {
      const payload = {
        category_id: patch.category_id ?? site.category_id,
        url: site.url,
        backup_url: site.backup_url,
        internal_url: site.internal_url,
        logo: site.logo,
        title: site.title,
        desc: site.desc,
        sort_order: site.sort_order,
        is_visible: patch.is_visible ?? site.is_visible,
        update_port_enabled: patch.update_port_enabled ?? site.update_port_enabled,
      }
      await postJson(`/api/sites/update/${site.id}`, payload)
      if (patch.is_visible !== undefined) {
        push({
          title: '已更新导航显隐',
          detail: `${site.title}：${patch.is_visible ? '显示' : '隐藏'}`,
          tone: 'success',
        })
      } else if (patch.update_port_enabled !== undefined) {
        push({
          title: '已更新端口更新开关',
          detail: `${site.title}：${patch.update_port_enabled ? '开启' : '关闭'}`,
          tone: 'success',
        })
      }
      await reloadSites()
    } catch (e: any) {
      push({ title: '更新失败', detail: e?.message || '请稍后重试', tone: 'danger' })
      await reloadSites()
    } finally {
      setOneRowBusy(site.id, false)
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
      await reloadSites()
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
      await reloadSites()
    } catch (e: any) {
      push({ title: '批量操作失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setBatchSaving(false)
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
            <div className="flex items-center gap-2 truncate text-xl font-semibold sm:text-2xl">
              网站管理
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : null}
            </div>
            <div className="truncate text-sm text-muted-foreground">支持增删改、显隐开关、批量改分类/显隐、搜索过滤</div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          {selected.size > 0 ? (
            <Button
              variant="outline"
              className="rounded-xl"
              size="icon"
              onClick={() => setBatchOpen(true)}
              aria-label={`批量操作（${selected.size}）`}
              title={`批量操作（${selected.size}）`}
            >
              <Layers className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            onClick={openCreate}
            disabled={loading}
            className="rounded-xl"
            size="icon"
            aria-label="新增站点"
            title="新增站点"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

      <div className="flex flex-nowrap gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:w-80 sm:flex-none">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="按标题 / URL 搜索"
            className="min-w-0 pl-9 pr-9"
            disabled={loading}
          />
          {query ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => {
                setQuery('')
                setPage(1)
              }}
              aria-label="清除搜索"
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 sm:w-64 sm:flex-none">
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            disabled={loading}
          >
            <option value="all">全部分类</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <SitesMobileList
        items={pageItems}
        categoryName={categoryName}
        loading={loading}
        isRowBusy={isRowBusy}
        onToggleVisible={(site, checked) => updateSite(site, { is_visible: checked })}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      <Card className="hidden overflow-hidden rounded-none md:block">
        <SitesTable
          items={pageItems}
          selected={selected}
          allChecked={allChecked}
          someChecked={someChecked}
          toggleAll={toggleAll}
          toggleOne={toggleOne}
          loading={loading}
          isRowBusy={isRowBusy}
          onToggleVisible={(site, checked) => updateSite(site, { is_visible: checked })}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          tableColWidth={tableColWidth}
          tableTotalWidth={tableTotalWidth}
          resizeStart={resizeStart}
          categoryName={categoryName}
        />
      </Card>

      {filtered.length > 0 ? (
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="text-xs text-muted-foreground sm:text-sm">
            <span className="sm:inline">共 {filtered.length} 条 · 第 {page} / {totalPages} 页</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="hidden h-9 rounded-md border bg-background px-2 text-xs outline-none sm:block sm:text-sm"
              value={String(pageSize)}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              disabled={loading}
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
                  <PaginationButton onClick={() => setPage(1)} disabled={loading || page <= 1}>
                    首页
                  </PaginationButton>
                </PaginationItem>
                <PaginationItem>
                  <PaginationButton onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1}>
                    <span className="hidden sm:inline">上一页</span>
                    <ChevronLeft className="h-4 w-4 sm:hidden" />
                  </PaginationButton>
                </PaginationItem>
                <PaginationItem>
                  <PaginationButton onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={loading || page >= totalPages}>
                    <span className="hidden sm:inline">下一页</span>
                    <ChevronRight className="h-4 w-4 sm:hidden" />
                  </PaginationButton>
                </PaginationItem>
                <PaginationItem className="hidden sm:block">
                  <PaginationButton onClick={() => setPage(totalPages)} disabled={loading || page >= totalPages}>
                    末页
                  </PaginationButton>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      ) : null}

      <SiteEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
          setEditorOpen(open)
        }}
        editing={editing}
        categories={categories}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={save}
      />

      <SiteDeleteDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} deleting={deleting} onConfirm={confirmDelete} />

      <SitesBatchDialog
        open={batchOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBatchCategoryId('')
            setBatchVisible('keep')
          }
          setBatchOpen(open)
        }}
        selectedCount={selected.size}
        categories={categories}
        batchCategoryId={batchCategoryId}
        setBatchCategoryId={setBatchCategoryId}
        batchVisible={batchVisible}
        setBatchVisible={setBatchVisible}
        saving={batchSaving}
        onSubmit={submitBatch}
      />
    </div>
  )
}
