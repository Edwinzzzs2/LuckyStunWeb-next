import type { RefObject } from 'react'

import type { NetworkType } from '@/hooks/use-navigation-preferences'
import type { Section, Site } from '@/data/navigation/types'

import { SiteCard } from '@/app/components/navigation/site-card'
import { normalizeUrl } from '@/lib/utils'

type NavigationContentProps = {
  sections: Section[]
  network: NetworkType
  contentScrollRef: RefObject<HTMLDivElement | null>
  resolveTargetUrl: (site: Site, network: NetworkType) => string
  placeholderLogoUrl: string
  sectionDepths?: Record<string, number>
}

export function NavigationContent({
  sections,
  network,
  contentScrollRef,
  resolveTargetUrl,
  placeholderLogoUrl,
  sectionDepths,
}: NavigationContentProps) {
  return (
    <main ref={contentScrollRef} className="h-full overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
      <div className="mx-auto w-full max-w-[1560px] space-y-4">
        {sections.map((section) => (
          <section key={section.id} id={`sec-${section.id}`} className="scroll-mt-20">
            <div className="flex items-center justify-between gap-4">
              <div
                className={
                  (sectionDepths?.[section.id] ?? 0) > 0
                    ? 'text-[14px] leading-5 text-muted-foreground flex items-center gap-2'
                    : 'text-[18px] leading-7 text-foreground flex items-center gap-2'
                }
              >
                <i
                  className={
                    (sectionDepths?.[section.id] ?? 0) > 0
                      ? `iconfont ${section.icon || 'icon-daohang2'} text-[16px] opacity-70`
                      : `iconfont ${section.icon || 'icon-daohang2'} text-[18px] opacity-80`
                  }
                  aria-hidden="true"
                />
                <span className="truncate">{section.name}</span>
              </div>
            </div>
            <div
              className={
                (sectionDepths?.[section.id] ?? 0) > 0
                  ? 'mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
                  : 'mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4'
              }
            >
              {section.sites.map((site, idx) => {
                const targetUrl = resolveTargetUrl(site, network)
                return (
                  <SiteCard
                    key={`${section.id}-${idx}-${normalizeUrl(site.url)}`}
                    site={site}
                    targetUrl={targetUrl}
                    placeholderLogoUrl={placeholderLogoUrl}
                  />
                )
              })}
            </div>
          </section>
        ))}

        {!sections.length ? (
          <div className="py-20">
            <div className="max-w-[420px] mx-auto text-center">
              <div className="text-base font-semibold">没有匹配结果</div>
              <div className="mt-2 text-sm text-muted-foreground">尝试换一个关键词，或清空搜索。</div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}

