import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { normalizeUrl } from '@/lib/utils'
import type { Site } from '@/data/navigation/types'
import { Ellipsis } from 'lucide-react'

type SiteCardProps = {
  site: Site
  targetUrl: string
  placeholderLogoUrl: string
}

function openNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function SiteCard({ site, targetUrl, placeholderLogoUrl }: SiteCardProps) {
  const mainUrl = normalizeUrl(site.url)
  const backupUrl = normalizeUrl(site.backup_url)
  const internalUrl = normalizeUrl(site.internal_url)
  const logo = site.logo || placeholderLogoUrl

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className="group relative border border-border/60 bg-card shadow-sm transition-all duration-200 ease-out cursor-pointer [@media(hover:hover)]:hover:-translate-y-0.5 [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:shadow-black/10 dark:[@media(hover:hover)]:hover:shadow-black/40"
          tabIndex={0}
          onClick={(e) => {
            const btn = (e.target as HTMLElement).closest('button')
            if (btn) return
            if (!targetUrl) return
            openNewTab(targetUrl)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!targetUrl) return
              openNewTab(targetUrl)
            }
          }}
        >
          <CardContent className="p-3.5 pr-12">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute top-2.5 right-2.5 h-7 w-7 rounded-md bg-background/80 backdrop-blur shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto"
                  aria-label="更多操作"
                  title="更多操作"
                >
                  <Ellipsis className="opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={!mainUrl} onSelect={() => mainUrl && openNewTab(mainUrl)}>
                  打开外网
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!backupUrl} onSelect={() => backupUrl && openNewTab(backupUrl)}>
                  打开备用
                </DropdownMenuItem>
                <DropdownMenuItem disabled={!internalUrl} onSelect={() => internalUrl && openNewTab(internalUrl)}>
                  打开内网
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/40 ring-1 ring-border/40 overflow-hidden flex items-center justify-center">
                <img
                  className="h-6 w-6 object-contain"
                  src={logo}
                  alt={site.title || ''}
                  title={targetUrl || ''}
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    img.onerror = null
                    img.src = placeholderLogoUrl
                  }}
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="min-w-0 truncate text-[13px] leading-5 h-5 font-medium text-foreground">{site.title}</div>
                <div className="mt-1 text-xs leading-4 h-4 text-muted-foreground truncate" title={site.desc || ''}>
                  {site.desc || ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={!mainUrl} onSelect={() => mainUrl && openNewTab(mainUrl)}>
          打开外网
        </ContextMenuItem>
        <ContextMenuItem disabled={!backupUrl} onSelect={() => backupUrl && openNewTab(backupUrl)}>
          打开备用
        </ContextMenuItem>
        <ContextMenuItem disabled={!internalUrl} onSelect={() => internalUrl && openNewTab(internalUrl)}>
          打开内网
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

