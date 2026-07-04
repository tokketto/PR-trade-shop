import { NextRequest, NextResponse } from 'next/server'
import { getPartners, savePartners } from '@/lib/partners'

export async function GET() {
  const partners = await getPartners()
  return NextResponse.json(partners)
}

export async function POST(req: NextRequest) {
  const { name, code } = await req.json()

  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: 'Name and code are required' }, { status: 400 })
  }

  try {
    const partners = await getPartners()
    if (partners.some(p => p.code === code.trim())) {
      return NextResponse.json({ error: 'That code is already in use' }, { status: 409 })
    }

    const updated = [...partners, { name: name.trim(), code: code.trim(), active: true }]
    await savePartners(updated)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Add partner error:', err)
    return NextResponse.json({ error: 'Could not save — database unavailable' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { code, active } = await req.json()

  if (!code || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const partners = await getPartners()
    const updated = partners.map(p => p.code === code ? { ...p, active } : p)
    await savePartners(updated)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update partner error:', err)
    return NextResponse.json({ error: 'Could not save — database unavailable' }, { status: 500 })
  }
}
