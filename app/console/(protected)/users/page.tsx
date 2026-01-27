"use client"

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, KeyRound } from 'lucide-react'

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
import { useConsoleAuth } from '@/app/console/_components/console-auth'
import { useConsoleToast } from '@/app/console/_components/console-toast'

type UserRow = {
  id: number
  username: string
  isAdmin: boolean
  createdAt?: string
}

export default function ConsoleUsersPage() {
  const { user } = useConsoleAuth()
  const { push } = useConsoleToast()

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
    load()
  }, [user?.isAdmin])

  const meId = user?.id
  const visibleUsers = useMemo(() => users.slice().sort((a, b) => a.id - b.id), [users])

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="truncate text-2xl font-semibold">后台管理</div>
          <div className="truncate text-sm text-muted-foreground">创建用户、删除用户、重置密码</div>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={loading} className="rounded-xl">
          <Plus className="h-4 w-4" />
          创建用户
        </Button>
      </div>

      <Card className="overflow-hidden rounded-3xl">
        <div className="grid grid-cols-12 gap-3 border-b bg-muted/40 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="col-span-2">ID</div>
          <div className="col-span-4">用户名</div>
          <div className="col-span-2">角色</div>
          <div className="col-span-4 text-right">操作</div>
        </div>
        <div className="divide-y">
          {visibleUsers.map((u) => (
            <div key={u.id} className="grid grid-cols-12 gap-3 px-6 py-3">
              <div className="col-span-2 text-sm font-semibold">{u.id}</div>
              <div className="col-span-4 min-w-0">
                <div className="truncate text-sm font-semibold">{u.username}</div>
                <div className="truncate text-xs text-muted-foreground">{u.createdAt ? String(u.createdAt) : ''}</div>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">{u.isAdmin ? '管理员' : '用户'}</div>
              <div className="col-span-4 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setResetTarget(u)}>
                  <KeyRound className="h-4 w-4" />
                  重置密码
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200"
                  onClick={() => setDeleteTarget(u)}
                  disabled={meId === u.id}
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </div>
            </div>
          ))}
          {visibleUsers.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">{loading ? '加载中...' : '暂无用户'}</div>
          ) : null}
        </div>
      </Card>

      <Dialog open={createOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateUsername('')
          setCreatePassword('')
          setCreateIsAdmin(false)
        }
        setCreateOpen(open)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建用户</DialogTitle>
            <DialogDescription>为管理后台新增登录账号</DialogDescription>
          </DialogHeader>
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

      <Dialog open={Boolean(resetTarget)} onOpenChange={(open) => {
        if (!open) {
          setResetTarget(null)
          setResetPassword('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>用户：{resetTarget?.username}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <label className="text-sm font-medium">新密码</label>
            <Input value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} type="password" placeholder="至少 6 位" />
          </div>
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

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => {
        if (!open) setDeleteTarget(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除用户</DialogTitle>
            <DialogDescription>将从系统中移除该用户</DialogDescription>
          </DialogHeader>
          <div className="text-sm">确认删除用户「{deleteTarget?.username}」？此操作不可撤销。</div>
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
    </div>
  )
}

