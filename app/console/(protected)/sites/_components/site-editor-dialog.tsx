"use client"

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { cn } from '@/lib/utils'

import type { CategoryFlat, SiteFormState, SiteRow } from './types'

export function SiteEditorDialog({
  open,
  onOpenChange,
  editing,
  categories,
  form,
  setForm,
  saving,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: SiteRow | null
  categories: CategoryFlat[]
  form: SiteFormState
  setForm: (next: SiteFormState | ((prev: SiteFormState) => SiteFormState)) => void
  saving: boolean
  onSave: () => void
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const onChange = () => setIsMobile(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const body = (
    <div className="grid gap-6 py-2">
      {/* 分类选择 */}
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-foreground/90">所属分类</label>
        <select
          className={cn(
            'h-10 w-full rounded-xl border bg-background px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
            !form.category_id || form.category_id === '0' ? 'text-muted-foreground' : ''
          )}
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* 左侧：基本信息 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-l-4 border-primary/40 pl-3">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">基本信息</span>
          </div>
          <div className="grid gap-4 rounded-2xl border bg-muted/30 p-4">
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">站点标题</label>
              <Input
                className="rounded-xl border-none bg-background shadow-sm"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="例如：memos"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">Logo 图标地址</label>
              <Input
                className="rounded-xl border-none bg-background shadow-sm"
                value={form.logo}
                onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">站点描述</label>
              <Input
                className="rounded-xl border-none bg-background shadow-sm"
                value={form.desc}
                onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))}
                placeholder="一句话描述该站点"
              />
            </div>
          </div>
        </div>

        {/* 右侧：访问链接 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-l-4 border-primary/40 pl-3">
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">访问链接</span>
          </div>
          <div className="grid gap-4 rounded-2xl border bg-muted/30 p-4">
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">主链接 (外部访问)</label>
              <Input
                className="rounded-xl border-none bg-background shadow-sm"
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">备用链接</label>
              <Input
                className="rounded-xl border-none bg-background shadow-sm"
                value={form.backup_url}
                onChange={(e) => setForm((p) => ({ ...p, backup_url: e.target.value }))}
                placeholder="https://backup.example.com"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-medium text-muted-foreground">内网链接</label>
              <Input
                className="rounded-xl border-none bg-background shadow-sm"
                value={form.internal_url}
                onChange={(e) => setForm((p) => ({ ...p, internal_url: e.target.value }))}
                placeholder="http://192.168.1.2:8080"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 底部：排序与配置 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-l-4 border-primary/40 pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">其它配置</span>
        </div>
        <div className="grid gap-4 rounded-2xl border bg-muted/30 p-4 md:grid-cols-3">
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">排序权重</label>
            <Input
              className="rounded-xl border-none bg-background shadow-sm"
              value={form.sort_order}
              onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))}
              type="number"
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-background p-3 shadow-sm">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">导航显示</div>
              <div className="truncate text-[10px] text-muted-foreground">控制前台导航页可见性</div>
            </div>
            <Switch checked={form.is_visible} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_visible: checked }))} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-background p-3 shadow-sm">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">端口更新</div>
              <div className="truncate text-[10px] text-muted-foreground">允许批量脚本更新端口</div>
            </div>
            <Switch
              checked={form.update_port_enabled}
              onCheckedChange={(checked) => setForm((p) => ({ ...p, update_port_enabled: checked }))}
            />
          </div>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="flex h-[92dvh] flex-col p-0 rounded-t-2xl overflow-hidden"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex-1 overflow-y-auto p-6">
            <SheetHeader>
              <SheetTitle>{editing ? '编辑站点' : '新增站点'}</SheetTitle>
              <SheetDescription>{editing ? `ID: ${editing.id}` : '创建一个新的站点'}</SheetDescription>
            </SheetHeader>
            <div className="mt-4">{body}</div>
          </div>
          <SheetFooter className="shrink-0 border-t bg-background p-6 pt-4">
            <Button variant="outline" className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={onSave} disabled={saving}>
              {saving ? '保存中...' : editing ? '保存' : '创建'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{editing ? '编辑站点' : '新增站点'}</DialogTitle>
          <DialogDescription>{editing ? `ID: ${editing.id}` : '创建一个新的站点'}</DialogDescription>
        </DialogHeader>
        {body}
        <DialogFooter>
          <Button variant="outline" className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" onClick={onSave} disabled={saving}>
            {saving ? '保存中...' : editing ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
