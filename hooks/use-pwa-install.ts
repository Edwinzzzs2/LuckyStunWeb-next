"use client"

import { useCallback, useEffect, useRef, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const promptRef = useRef<InstallPromptEvent | null>(null)

  const checkInstalled = useCallback(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    const iOSStandalone = (window.navigator as any).standalone === true
    setIsInstalled(standalone || iOSStandalone)
  }, [])

  useEffect(() => {
    checkInstalled()

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as InstallPromptEvent
      setCanInstall(true)
    }

    const onInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      promptRef.current = null
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [checkInstalled])

  const promptInstall = useCallback(async () => {
    const promptEvent = promptRef.current
    if (!promptEvent) return false
    await promptEvent.prompt()
    const result = await promptEvent.userChoice
    if (result.outcome === 'accepted') {
      setCanInstall(false)
    }
    return result.outcome === 'accepted'
  }, [])

  return { canInstall, isInstalled, promptInstall }
}
