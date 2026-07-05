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

  const { code, newCode, name, active, shippingAddress, contactName, contactEmail } = await req.json()

  if (!code) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const partners = await getPartners()
    const target = partners.find(p => p.code === code)
    if (!target) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const finalCode = newCode?.trim() ? newCode.trim() : code
    if (finalCode !== code && partners.some(p => p.code === finalCode)) {
      return NextResponse.json({ error: 'That code is already in use' }, { status: 409 })
    }
    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ error: 'Partner name cannot be empty' }, { status: 400 })
    }

    const updated = partners.map(p => p.code === code
      ? {
          ...p,
          code: finalCode,
          ...(name?.trim() ? { name: name.trim() } : {}),
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

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { code } = await req.json()

  if (!code) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  try {
    const partners = await getPartners()
    const target = partners.find(p => p.code === code)
    if (!target) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }
    if (target.isAdmin) {
      return NextResponse.json({ error: 'Cannot delete the Admin account' }, { status: 400 })
    }

    const updated = partners.filter(p => p.code !== code)
    await savePartners(updated)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Delete partner error:', err)
    return NextResponse.json({ error: 'Could not save — database unavailable' }, { status: 500 })
  }
}
