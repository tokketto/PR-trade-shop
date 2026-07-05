import { NextRequest, NextResponse } from 'next/server'
import { getPartners, savePartners } from '@/lib/partners'
import { isAdminRequest } from '@/lib/session'

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const partners = await getPartners()
  return NextResponse.json(partners)
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code, active, shippingAddress, contactName, contactEmail } = await req.json()

  if (!code || (typeof active !== 'boolean' && shippingAddress === undefined && contactName === undefined && contactEmail === undefined)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const partners = await getPartners()
    const updated = partners.map(p => p.code === code
      ? {
          ...p,
          ...(typeof active === 'boolean' ? { active } : {}),
          ...(shippingAddress !== undefined ? { shippingAddress } : {}),
          ...(contactName !== undefined ? { contactName } : {}),
          ...(contactEmail !== undefined ? { contactEmail } : {}),
        }
      : p)
    await savePartners(updated)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Update partner error:', err)
    return NextResponse.json({ error: 'Could not save — database unavailable' }, { status: 500 })
  }
}
