import { NextRequest, NextResponse } from 'next/server'
import { getPartners } from '@/lib/partners'
import { ADMIN_SESSION_COOKIE, createSessionToken, SESSION_MAX_AGE_SECONDS } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  // Codes live in KV (seeded from env on first run) — never sent to the browser
  const partners = await getPartners()
  const match = partners.find(p => p.code === code && p.active)

  if (!match) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 })
  }

  // Return only the partner name and role — never the code itself
  const res = NextResponse.json({ name: match.name, isAdmin: !!match.isAdmin })

  if (match.isAdmin) {
    res.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(match.name), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
  }

  return res
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_SESSION_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}
