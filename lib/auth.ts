import jwt from 'jsonwebtoken'
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
  } catch {
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
    const payload = verifyToken(parts[1])
    return payload
  }
  const cookieToken = getCookieToken(req)
  if (!cookieToken) return null
  return verifyToken(cookieToken)
}
