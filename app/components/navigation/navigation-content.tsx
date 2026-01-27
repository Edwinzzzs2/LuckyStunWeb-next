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
}

export function NavigationContent({
  sections,
  network,
  contentScrollRef,
  resolveTargetUrl,
  placeholderLogoUrl,
}: NavigationContentProps) {
  return (
    <main ref={contentScrollRef} className="flex-1 overflow-y-auto px-4 lg:px-7 py-6">
      <div className="max-w-[1240px] mx-auto">
        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.id} id={`sec-${section.id}`} className="scroll-mt-20">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[16px] leading-6 font-semibold">{section.name}</div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      </div>
    </main>
  )
}

