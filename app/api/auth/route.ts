import { NextRequest, NextResponse } from 'next/server'
import { getPartners } from '@/lib/partners'

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
  return NextResponse.json({ name: match.name, isAdmin: !!match.isAdmin })
}
