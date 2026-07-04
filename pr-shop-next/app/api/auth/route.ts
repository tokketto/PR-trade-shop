import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code } = await req.json()

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 })
  }

  // Codes live in env variable — never sent to the browser
  const raw = process.env.PARTNER_CODES || ''
  const partners = raw.split(',').map(entry => {
    const [name, partnerCode] = entry.split(':')
    return { name: name?.trim(), code: partnerCode?.trim() }
  })

  const match = partners.find(p => p.code === code)

  if (!match) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 401 })
  }

  const isAdmin = match.name === 'Admin'

  // Return only the partner name and role — never the code itself
  return NextResponse.json({ name: match.name, isAdmin })
}
