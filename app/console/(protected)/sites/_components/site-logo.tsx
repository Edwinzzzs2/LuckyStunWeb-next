"use client"

import { useState } from 'react'

export function SiteLogo({ logo, title }: { logo: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  const src = logo?.trim() || ''
  if (!src || failed) {
    const t = (title || '').trim()
    const ch = t ? t.slice(0, 1).toUpperCase() : '#'
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/40 text-xs font-semibold text-muted-foreground">
        {ch}
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={title}
      referrerPolicy="no-referrer"
      className="h-9 w-9 rounded-xl border bg-muted/20 object-contain"
      onError={() => setFailed(true)}
    />
  )
}

