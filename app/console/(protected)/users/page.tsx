"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Menu, Plus, Trash2, KeyRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
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
import { useConsoleAuth } from '@/app/console/_components/console-auth'
import { useConsoleToast } from '@/app/console/_components/console-toast'
import { useConsoleShell } from '@/app/console/_components/console-shell'

type UserRow = {
  id: number
  username: string
  isAdmin: boolean
  createdAt?: string
}

function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function ConsoleUsersPage() {
  const { user } = useConsoleAuth()
  const { push } = useConsoleToast()
  const { openSidebar } = useConsoleShell()
  const didLoadRef = useRef(false)

  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserRow[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [createUsername, setCreateUsername] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createIsAdmin, setCreateIsAdmin] = useState(false)
  const [creating, setCreating] = useState(false)

  const [resetTarget, setResetTarget] = useState<UserRow | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)
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
      const res = await fetchConsoleJson<{ users: UserRow[] }>('/api/auth/users')
      setUsers(res.users)
    } catch (e: any) {
      push({ title: '加载用户失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.isAdmin) return
    if (didLoadRef.current) return
    didLoadRef.current = true
    load()
  }, [user?.isAdmin])

  const meId = user?.id
  const visibleUsers = useMemo(() => users.slice().sort((a, b) => a.id - b.id), [users])

  const createUserBody = (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">用户名</label>
        <Input value={createUsername} onChange={(e) => setCreateUsername(e.target.value)} placeholder="例如：test" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">密码</label>
        <Input value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} type="password" placeholder="至少 6 位" />
      </div>
      <div className="flex items-center justify-between rounded-xl border px-4 py-3">
        <div>
          <div className="text-sm font-medium">管理员</div>
          <div className="text-xs text-muted-foreground">可访问用户管理等敏感操作</div>
        </div>
        <Switch checked={createIsAdmin} onCheckedChange={setCreateIsAdmin} />
      </div>
    </div>
  )

  const resetPasswordBody = (
    <div className="grid gap-2">
      <label className="text-sm font-medium">新密码</label>
      <Input value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} type="password" placeholder="至少 6 位" />
    </div>
  )

  const deleteUserBody = (
    <div className="text-sm">确认删除用户「{deleteTarget?.username}」？此操作不可撤销。</div>
  )

  async function createUser() {
    const username = createUsername.trim()
    if (!username || !createPassword) {
      push({ title: '请填写必填项', detail: '用户名与密码不能为空', tone: 'warning' })
      return
    }
    setCreating(true)
    try {
      await postJson('/api/auth/register', { username, password: createPassword, isAdmin: createIsAdmin })
      push({ title: '已创建用户', detail: username, tone: 'success' })
      setCreateOpen(false)
      setCreateUsername('')
      setCreatePassword('')
      setCreateIsAdmin(false)
      await load()
    } catch (e: any) {
      push({ title: '创建失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setCreating(false)
    }
  }

  async function resetUserPassword() {
    if (!resetTarget) return
    if (!resetPassword || resetPassword.length < 6) {
      push({ title: '密码不合法', detail: '新密码长度至少为6个字符', tone: 'warning' })
      return
    }
    setResetting(true)
    try {
      const res = await postJson<{ message?: string }>('/api/auth/update-password', { userId: resetTarget.id, newPassword: resetPassword })
      push({ title: '已重置密码', detail: res?.message || resetTarget.username, tone: 'success' })
      setResetTarget(null)
      setResetPassword('')
    } catch (e: any) {
      push({ title: '重置失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setResetting(false)
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await postJson<{ message?: string }>(`/api/auth/delete/${deleteTarget.id}`)
      push({ title: '已删除用户', detail: res?.message || deleteTarget.username, tone: 'success' })
      setDeleteTarget(null)
      await load()
    } catch (e: any) {
      push({ title: '删除失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setDeleting(false)
    }
  }

  if (!user?.isAdmin) {
    return (
      <div className="rounded-2xl border bg-card p-6">
        <div className="text-lg font-semibold">需要管理员权限</div>
        <div className="mt-2 text-sm text-muted-foreground">当前账号无权访问用户管理。</div>
      </div>
    )
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
            <div className="truncate text-xl font-semibold sm:text-2xl">后台管理</div>
            <div className="truncate text-sm text-muted-foreground">创建用户、删除用户、重置密码</div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button onClick={() => setCreateOpen(true)} disabled={loading} className="rounded-xl" size="icon" title="创建用户">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>

      <Card className="overflow-hidden rounded-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[15%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">ID</TableHead>
              <TableHead className="w-[35%] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">用户名</TableHead>
              <TableHead className="w-[20%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">角色</TableHead>
              <TableHead className="w-[30%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-center text-sm font-semibold">{u.id}</TableCell>
                <TableCell className="min-w-0 text-left">
                  <div className="flex min-w-0 flex-col items-start">
                    <div className="truncate text-sm font-semibold">{u.username}</div>
                    <div className="truncate text-xs text-muted-foreground">{formatDate(u.createdAt)}</div>
                  </div>
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">{u.isAdmin ? '管理员' : '用户'}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setResetTarget(u)} aria-label="重置密码" title="重置密码">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                      onClick={() => setDeleteTarget(u)}
                      disabled={meId === u.id}
                      aria-label="删除"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {visibleUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  {loading ? '加载中...' : '暂无用户'}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>

      {isMobile ? (
        <Sheet open={createOpen} onOpenChange={(open) => {
          if (!open) {
            setCreateUsername('')
            setCreatePassword('')
            setCreateIsAdmin(false)
          }
          setCreateOpen(open)
        }}>
          <SheetContent
             side="bottom"
             className="flex h-[auto] max-h-[92dvh] flex-col p-0 rounded-t-2xl overflow-hidden"
             onOpenAutoFocus={(e) => e.preventDefault()}
             onCloseAutoFocus={(e) => e.preventDefault()}
           >
             <div className="flex-1 overflow-y-auto p-6">
               <SheetHeader>
                 <SheetTitle>创建用户</SheetTitle>
                 <SheetDescription>为管理后台新增登录账号</SheetDescription>
               </SheetHeader>
               <div className="mt-4">{createUserBody}</div>
             </div>
             <SheetFooter className="border-t bg-background p-6 pt-4 flex flex-row justify-end gap-2 shrink-0">
               <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
                 取消
               </Button>
               <Button className="rounded-xl" onClick={createUser} disabled={creating}>
                 {creating ? '创建中...' : '创建'}
               </Button>
             </SheetFooter>
           </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={createOpen} onOpenChange={(open) => {
          if (!open) {
            setCreateUsername('')
            setCreatePassword('')
            setCreateIsAdmin(false)
          }
          setCreateOpen(open)
        }}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>创建用户</DialogTitle>
              <DialogDescription>为管理后台新增登录账号</DialogDescription>
            </DialogHeader>
            {createUserBody}
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>
                取消
              </Button>
              <Button className="rounded-xl" onClick={createUser} disabled={creating}>
                {creating ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isMobile ? (
        <Sheet open={Boolean(resetTarget)} onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null)
            setResetPassword('')
          }
        }}>
          <SheetContent
             side="bottom"
             className="flex h-[auto] max-h-[92dvh] flex-col p-0 rounded-t-2xl overflow-hidden"
             onOpenAutoFocus={(e) => e.preventDefault()}
             onCloseAutoFocus={(e) => e.preventDefault()}
           >
             <div className="flex-1 overflow-y-auto p-6">
               <SheetHeader>
                 <SheetTitle>重置密码</SheetTitle>
                 <SheetDescription>用户：{resetTarget?.username}</SheetDescription>
               </SheetHeader>
               <div className="mt-4">{resetPasswordBody}</div>
             </div>
             <SheetFooter className="border-t bg-background p-6 pt-4 flex flex-row justify-end gap-2 shrink-0">
               <Button variant="outline" className="rounded-xl" onClick={() => setResetTarget(null)}>
                 取消
               </Button>
               <Button className="rounded-xl" onClick={resetUserPassword} disabled={resetting}>
                 {resetting ? '提交中...' : '确认重置'}
               </Button>
             </SheetFooter>
           </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => {
          if (!open) {
            setResetTarget(null)
            setResetPassword('')
          }
        }}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>重置密码</DialogTitle>
              <DialogDescription>用户：{resetTarget?.username}</DialogDescription>
            </DialogHeader>
            {resetPasswordBody}
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setResetTarget(null)}>
                取消
              </Button>
              <Button className="rounded-xl" onClick={resetUserPassword} disabled={resetting}>
                {resetting ? '提交中...' : '确认重置'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isMobile ? (
        <Sheet open={Boolean(deleteTarget)} onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}>
          <SheetContent
             side="bottom"
             className="flex h-[auto] max-h-[92dvh] flex-col p-0 rounded-t-2xl overflow-hidden"
             onOpenAutoFocus={(e) => e.preventDefault()}
             onCloseAutoFocus={(e) => e.preventDefault()}
           >
             <div className="flex-1 overflow-y-auto p-6">
               <SheetHeader>
                 <SheetTitle>删除用户</SheetTitle>
                 <SheetDescription>将从系统中移除该用户</SheetDescription>
               </SheetHeader>
               <div className="mt-4">{deleteUserBody}</div>
             </div>
             <SheetFooter className="border-t bg-background p-6 pt-4 flex flex-row justify-end gap-2 shrink-0">
               <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
                 取消
               </Button>
               <Button variant="destructive" className="rounded-xl" onClick={deleteUser} disabled={deleting}>
                 {deleting ? '删除中...' : '确认删除'}
               </Button>
             </SheetFooter>
           </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}>
          <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} onCloseAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>删除用户</DialogTitle>
              <DialogDescription>将从系统中移除该用户</DialogDescription>
            </DialogHeader>
            {deleteUserBody}
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTarget(null)}>
                取消
              </Button>
              <Button variant="destructive" className="rounded-xl" onClick={deleteUser} disabled={deleting}>
                {deleting ? '删除中...' : '确认删除'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
