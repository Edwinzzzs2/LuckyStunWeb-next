import { NextResponse } from 'next/server'

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

export function error(message: string, status = 500) {
  return NextResponse.json({ message }, { status })
}

export async function readJson<T>(req: Request) {
  try {
    const body = (await req.json()) as T
    return { data: body, error: null }
  } catch {
    return { data: null as T | null, error: error('无效的 JSON 请求体', 400) }
  }
}
