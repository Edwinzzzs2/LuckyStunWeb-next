"use client"

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface RestartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isRestarting: boolean
}

export function RestartDialog({ open, onOpenChange, onConfirm, isRestarting }: RestartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>重启服务</DialogTitle>
          <DialogDescription>
            将先拉取代码，等待约 1 分钟后再重启容器，服务可能会暂时中断。
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          确定要重启服务吗？
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" 
            onClick={() => onOpenChange(false)}
            disabled={isRestarting}
          >
            取消
          </Button>
          <Button 
            className="h-11 w-full rounded-xl sm:h-9 sm:w-auto" 
            onClick={onConfirm} 
            disabled={isRestarting}
          >
            {isRestarting ? '重启中...' : '确认重启'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}