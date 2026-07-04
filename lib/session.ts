import crypto from 'crypto'
import { NextRequest } from 'next/server'

export const ADMIN_SESSION_COOKIE = 'pr_admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12 // 12 hours

const SECRET = process.env.ADMIN_SESSION_SECRET
  || 'insecure-dev-fallback-set-ADMIN_SESSION_SECRET-in-vercel'

if (!process.env.ADMIN_SESSION_SECRET) {
  console.warn('ADMIN_SESSION_SECRET is not set — using an insecure fallback. Set it in your Vercel env vars.')
}

type SessionPayload = { name: string; isAdmin: boolean; exp: number }

export function createSessionToken(name: string): string {
  const payload: SessionPayload = { name, isAdmin: true, exp: Date.now() + SESSION_TTL_MS }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null

  const expectedSig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expectedSig)
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null
  }

  try {
    const payload: SessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function isAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return !!verifySessionToken(token)?.isAdmin
}

export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000
