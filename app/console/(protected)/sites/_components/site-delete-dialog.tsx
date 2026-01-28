"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import type { SiteRow } from './types'

export function SiteDeleteDialog({
  target,
  onClose,
  deleting,
  onConfirm,
}: {
  target: SiteRow | null
  onClose: () => void
  deleting: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除站点</DialogTitle>
          <DialogDescription>将从系统中移除该站点</DialogDescription>
        </DialogHeader>
        <div className="text-sm">确认删除站点「{target?.title}」？此操作不可撤销。</div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            取消
          </Button>
          <Button variant="destructive" className="rounded-xl" onClick={onConfirm} disabled={deleting}>
            {deleting ? '删除中...' : '确认删除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

