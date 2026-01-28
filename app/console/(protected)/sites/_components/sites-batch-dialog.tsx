"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { CategoryFlat } from './types'

export function SitesBatchDialog({
  open,
  onOpenChange,
  selectedCount,
  categories,
  batchCategoryId,
  setBatchCategoryId,
  batchVisible,
  setBatchVisible,
  saving,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  categories: CategoryFlat[]
  batchCategoryId: string
  setBatchCategoryId: (value: string) => void
  batchVisible: 'keep' | 'show' | 'hide'
  setBatchVisible: (value: 'keep' | 'show' | 'hide') => void
  saving: boolean
  onSubmit: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量操作</DialogTitle>
          <DialogDescription>已选择 {selectedCount} 个站点</DialogDescription>
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
          <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button className="rounded-xl" onClick={onSubmit} disabled={saving}>
            {saving ? '提交中...' : '确认提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

