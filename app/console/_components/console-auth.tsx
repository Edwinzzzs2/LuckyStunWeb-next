"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { fetchConsoleJson, postJson, type ApiError } from '@/app/console/_lib/http'

export type ConsoleUser = {
  id: number
  username: string
  isAdmin: boolean
}

type ConsoleAuthState = {
  user: ConsoleUser | null
  isLoading: boolean
}

type ConsoleAuthContextValue = ConsoleAuthState & {
  refresh: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const ConsoleAuthContext = createContext<ConsoleAuthContextValue | null>(null)

export function useConsoleAuth() {
  const ctx = useContext(ConsoleAuthContext)
  if (!ctx) throw new Error('useConsoleAuth must be used within ConsoleAuthProvider')
  return ctx
}

export function ConsoleAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConsoleAuthState>({ user: null, isLoading: true })

  const refresh = useCallback(async () => {
    try {
      const res = await fetchConsoleJson<{ user: ConsoleUser }>('/api/auth/me')
      setState({ user: res.user, isLoading: false })
    } catch (e) {
      const err = e as ApiError
      if (err.status === 401) {
        setState({ user: null, isLoading: false })
        return
      }
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const res = await postJson<{ user: ConsoleUser }>('/api/auth/login', { username, password })
    setState({ user: res.user, isLoading: false })
  }, [])

  const logout = useCallback(async () => {
    await postJson('/api/auth/logout')
    setState({ user: null, isLoading: false })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(() => ({ ...state, refresh, login, logout }), [state, refresh, login, logout])

  return <ConsoleAuthContext.Provider value={value}>{children}</ConsoleAuthContext.Provider>
}

