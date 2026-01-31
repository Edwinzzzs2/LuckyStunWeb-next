import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'
type TokenPayload = { userId: number; username: string; isAdmin: boolean }

function getSecret() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET missing')
  return s
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '30d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload
  } catch (e) {
    logger.error('[Auth] Token verification failed:', e)
    return null
  }
}

function getCookieToken(req: Request) {
  const cookieHeader = req.headers.get('cookie') || ''
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=')
    if (key === 'token') {
      return decodeURIComponent(rest.join('='))
    }
  }
  return null
}

export function getAuthUser(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const parts = auth.split(' ')
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    logger.info('[Auth] Found Bearer token')
    const payload = verifyToken(parts[1])
    if (payload) {
      // console.log(`[Auth] Bearer verified for ${payload.username}`)
      return payload
    }
    logger.warn('[Auth] Bearer token verification failed')
  }
  
  const cookieToken = getCookieToken(req)
  if (!cookieToken) {
    logger.info('[Auth] No token found in cookies or authorization header')
    return null
  }
  
  const payload = verifyToken(cookieToken)
  if (!payload) {
    logger.warn('[Auth] Cookie token verification failed')
  }
  return payload
}
