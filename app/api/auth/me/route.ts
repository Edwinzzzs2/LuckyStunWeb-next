import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = getAuthUser(req)
  if (!user) {
    return NextResponse.json({ message: '需要登录' }, { status: 401 })
  }
  return NextResponse.json({
    user: {
      id: user.userId,
      username: user.username,
      isAdmin: user.isAdmin,
    },
  })
}
