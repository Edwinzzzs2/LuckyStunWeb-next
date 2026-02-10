"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useConsoleAuth } from '@/app/console/_components/console-auth'
import { useConsoleToast } from '@/app/console/_components/console-toast'

export default function ConsoleLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-muted-foreground" />
        </div>
      }
    >
      <ConsoleLoginInner />
    </Suspense>
  )
}

function ConsoleLoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading, login } = useConsoleAuth()
  const { push } = useConsoleToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => username.trim().length > 0 && password.length > 0 && !submitting, [username, password, submitting])

  const nextUrl = useMemo(() => {
    const raw = searchParams.get('next')
    if (!raw) return '/console'
    if (raw.startsWith('/console')) return raw
    return '/console'
  }, [searchParams])

  useEffect(() => {
    if (isLoading) return
    if (user) router.replace(nextUrl)
  }, [isLoading, user, router, nextUrl])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const u = username.trim()
    if (!u || !password) return
    setSubmitting(true)
    try {
      await login(u, password)
      push({ title: '登录成功', detail: `欢迎回来，${u}`, tone: 'success' })
      router.replace(nextUrl)
    } catch (err: any) {
      push({ title: '登录失败', detail: err?.message || '请检查用户名或密码', tone: 'danger' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/40 px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-6xl items-center">
        <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="hidden lg:block">
            <div className="rounded-3xl border bg-card/70 p-10 shadow-sm backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-background">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xl font-semibold">LuckyStunWeb</div>
                  <div className="text-sm text-muted-foreground">管理后台（/console）</div>
                </div>
              </div>
              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border bg-card p-5">
                  <div className="text-sm font-medium">核心能力</div>
                  <div className="mt-2 grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" /><span>分类管理：树形结构，父子级约束</span></div>
                    <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" /><span>网站管理：增删改、显隐、批量操作、搜索</span></div>
                    <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" /><span>用户管理：管理员可见，重置密码、删除</span></div>
                    <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-foreground" /><span>日志查看：记录系统、GitHub 与与Lucky端口更新的主要日志端口更新触发</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <Card className="rounded-3xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">WebStack 管理后台</CardTitle>
                <CardDescription>登录后进入配置界面</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4" onSubmit={onSubmit}>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="username">用户名</label>
                    <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="admin"
                        className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium" htmlFor="password">密码</label>
                    <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? '隐藏密码' : '显示密码'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="mt-1 h-11 rounded-xl" disabled={!canSubmit}>
                    {submitting ? '登录中...' : '登录'}
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <span className="font-mono">/console</span> 路由下的管理端布局与交互参考
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
