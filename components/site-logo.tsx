"use client"

import { useMemo, useState } from 'react'

import { cn } from '@/lib/utils'

type SiteLogoVariant = 'console' | 'nav'

export function SiteLogo({
  logo,
  title,
  variant = 'console',
  className,
}: {
  logo: string | null | undefined
  title: string | null | undefined
  variant?: SiteLogoVariant
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = (logo || '').trim()
  const ch = useMemo(() => {
    const t = (title || '').trim()
    return t ? t.slice(0, 1).toUpperCase() : '#'
  }, [title])

  const imgClassName =
    variant === 'nav'
      ? 'h-6 w-6 object-contain'
      : 'h-9 w-9 rounded-xl border bg-muted/20 object-contain'
  const fallbackClassName =
    variant === 'nav'
      ? 'flex h-6 w-6 items-center justify-center text-xs font-semibold text-muted-foreground'
      : 'flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/40 text-xs font-semibold text-muted-foreground'

  if (!src || failed) {
    return <div className={cn(fallbackClassName, className)}>{ch}</div>
  }

  return (
    <img
      src={src}
      alt={title || ''}
      referrerPolicy="no-referrer"
      className={cn(imgClassName, className)}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}

