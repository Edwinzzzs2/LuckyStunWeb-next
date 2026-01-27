"use client"

import { useEffect } from 'react'

type UseHotkeysOptions = {
  onCommandK?: () => void
  onEscape?: () => void
}

export function useHotkeys(options: UseHotkeysOptions) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        options.onCommandK?.()
        return
      }
      if (e.key === 'Escape') {
        options.onEscape?.()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [options.onCommandK, options.onEscape])
}
