export type ApiError = Error & { status?: number }

export async function fetchConsoleJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.headers || {}),
  }
  
  // Try to get token from localStorage for Bearer auth fallback
  // This helps when cookies are not available or blocked (e.g. some PWA scenarios)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('console_token')
    if (token) {
      // @ts-ignore
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(input, {
    cache: 'no-store',
    // Ensure cookies are sent with requests, especially for PWA/mobile
    credentials: 'include',
    ...init,
    headers,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = text || res.statusText || 'Request failed'
    try {
      const parsed = text ? JSON.parse(text) : null
      if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) message = parsed.message
    } catch {
      // ignore
    }
    const err = new Error(message) as ApiError
    err.status = res.status
    throw err
  }

  return (await res.json()) as T
}

export async function postJson<T>(url: string, data?: unknown): Promise<T> {
  return fetchConsoleJson<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
}

