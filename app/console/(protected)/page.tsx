"use client"

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FolderTree, Globe, Menu, RefreshCw, Users, ClipboardList } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { fetchConsoleJson } from '@/app/console/_lib/http'
import { useConsoleAuth } from '@/app/console/_components/console-auth'
import { useConsoleToast } from '@/app/console/_components/console-toast'
import { useConsoleShell } from '@/app/console/_components/console-shell'

type CategoryNode = {
  id: number
  name: string
  en_name: string | null
  icon: string | null
  parent_id: number | null
  sort_order: number | null
  children: CategoryNode[]
}

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

function countRoots(nodes: CategoryNode[]) {
  return nodes.length
}

function countAll(nodes: CategoryNode[]) {
  let total = 0
  const walk = (n: CategoryNode[]) => {
    n.forEach((x) => {
      total += 1
      if (x.children?.length) walk(x.children)
    })
  }
  walk(nodes)
  return total
}

export default function ConsoleDashboardPage() {
  const { user } = useConsoleAuth()
  const { push } = useConsoleToast()
  const { openSidebar, setRefreshHandler } = useConsoleShell()
  const didLoadRef = useRef(false)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [sites, setSites] = useState<SiteRow[]>([])
  const [loading, setLoading] = useState(false)

  async function load(options?: { showToast?: boolean }) {
    const showToast = options?.showToast ?? false
    setLoading(true)
    try {
      const [cats, web] = await Promise.all([
        fetchConsoleJson<CategoryNode[]>('/api/categories'),
        fetchConsoleJson<SiteRow[]>('/api/sites'),
      ])
      setCategories(cats)
      setSites(web)
      if (showToast) push({ title: '刷新成功', detail: '统计信息已更新', tone: 'success' })
    } catch (e: any) {
      push({ title: '刷新失败', detail: e?.message || '请稍后重试', tone: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (didLoadRef.current) return
    didLoadRef.current = true
    load()
  }, [])

  useEffect(() => {
    setRefreshHandler(() => load({ showToast: true }))
    return () => setRefreshHandler(null)
  }, [setRefreshHandler])

  const stats = useMemo(() => {
    const totalCategories = countAll(categories)
    const rootCategories = countRoots(categories)
    const subCategories = Math.max(0, totalCategories - rootCategories)
    const totalSites = sites.length
    return { totalCategories, rootCategories, subCategories, totalSites }
  }, [categories, sites])

  return (
    <div className="grid gap-6">
      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:-mx-6 md:px-6">
        <div className="grid grid-cols-[1fr_auto] items-start gap-4 sm:items-center">
          <div className="grid grid-cols-[auto_1fr] items-start gap-3">
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
            <div>
              <div className="text-xl font-semibold sm:text-2xl">欢迎，{user?.username}</div>
              <div className="text-sm text-muted-foreground">快速查看统计与常用入口</div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              onClick={() => load({ showToast: true })}
              disabled={loading}
              aria-label={loading ? '刷新中' : '刷新统计'}
              title={loading ? '刷新中' : '刷新统计'}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>所有分类数量</CardDescription>
            <CardTitle className="text-3xl">{stats.totalCategories}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>分类总数</span>
            <FolderTree className="h-4 w-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>网站一级分类数量</CardDescription>
            <CardTitle className="text-3xl">{stats.rootCategories}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>一级分类</span>
            <FolderTree className="h-4 w-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>网站二级分类数量</CardDescription>
            <CardTitle className="text-3xl">{stats.subCategories}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>二级分类</span>
            <FolderTree className="h-4 w-4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>收录的站点总数</CardDescription>
            <CardTitle className="text-3xl">{stats.totalSites}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>站点总数</span>
            <Globe className="h-4 w-4" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/console/sites" className="rounded-2xl border bg-card p-5 shadow-sm transition hover:bg-accent">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
              <Globe className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">站点设置</div>
              <div className="mt-1 truncate text-sm text-muted-foreground">管理网站的基本信息，如标题、描述等</div>
            </div>
          </div>
        </Link>
        <Link href="/console/categories" className="rounded-2xl border bg-card p-5 shadow-sm transition hover:bg-accent">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
              <FolderTree className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">导航管理</div>
              <div className="mt-1 truncate text-sm text-muted-foreground">管理网站的导航菜单分类和子项目</div>
            </div>
          </div>
        </Link>
        {user?.isAdmin ? (
          <>
            <Link href="/console/users" className="rounded-2xl border bg-card p-5 shadow-sm transition hover:bg-accent">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">后台管理</div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">用户创建、删除、重置密码</div>
                </div>
              </div>
            </Link>
            <Link href="/console/webhook-logs" className="rounded-2xl border bg-card p-5 shadow-sm transition hover:bg-accent">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">系统日志</div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">查看系统、接口、GitHub 与Lucky的主要日志</div>
                </div>
              </div>
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
