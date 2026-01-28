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
    <div className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-medium">分类</label>
        <select
          className={cn(
            'h-10 w-full rounded-md border bg-background px-3 text-sm',
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

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">标题</label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="例如：memos" />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Logo</label>
            <Input value={form.logo} onChange={(e) => setForm((p) => ({ ...p, logo: e.target.value }))} placeholder="https://..." />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">描述</label>
            <Input value={form.desc} onChange={(e) => setForm((p) => ({ ...p, desc: e.target.value }))} placeholder="一句话描述" />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">主链接</label>
            <Input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))} placeholder="https://example.com" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">备用链接</label>
              <Input
                value={form.backup_url}
                onChange={(e) => setForm((p) => ({ ...p, backup_url: e.target.value }))}
                placeholder="https://backup.example.com"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">内网链接</label>
              <Input
                value={form.internal_url}
                onChange={(e) => setForm((p) => ({ ...p, internal_url: e.target.value }))}
                placeholder="http://192.168.1.2:8080"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <label className="text-sm font-medium">排序</label>
          <Input value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} type="number" />
        </div>
        <div className="flex items-center justify-between rounded-xl border px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">导航显示</div>
            <div className="truncate text-xs text-muted-foreground">控制前台导航页</div>
          </div>
          <Switch checked={form.is_visible} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_visible: checked }))} />
        </div>
        <div className="flex items-center justify-between rounded-xl border px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">端口更新</div>
            <div className="truncate text-xs text-muted-foreground">用于批量更新端口</div>
          </div>
          <Switch
            checked={form.update_port_enabled}
            onCheckedChange={(checked) => setForm((p) => ({ ...p, update_port_enabled: checked }))}
          />
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
          <SheetFooter className="border-t bg-background p-6 pt-4 flex flex-row justify-end gap-2 shrink-0">
            <Button variant="outline" className="rounded-xl" size="sm" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button className="rounded-xl" size="sm" onClick={onSave} disabled={saving}>
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
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button className="rounded-xl" onClick={onSave} disabled={saving}>
            {saving ? '保存中...' : editing ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
