import { kvGetString, kvSetString } from './kv'

export type Partner = {
  name: string
  code: string
  active: boolean
  isAdmin?: boolean
  shippingAddress?: string
  contactName?: string
  contactEmail?: string
}

const PARTNERS_KEY = 'partners'

function seedFromEnv(): Partner[] {
  const raw = process.env.PARTNER_CODES || ''
  return raw.split(',').filter(Boolean).map(entry => {
    const [name, code] = entry.split(':')
    return { name: name?.trim() || '', code: code?.trim() || '', active: true, isAdmin: name?.trim() === 'Admin' }
  }).filter(p => p.name && p.code)
}

export async function getPartners(): Promise<Partner[]> {
  try {
    const raw = await kvGetString(PARTNERS_KEY)
    if (raw) {
      try { return JSON.parse(raw) } catch { /* fall through and reseed */ }
    }
    const seeded = seedFromEnv()
    await savePartners(seeded)
    return seeded
  } catch (err) {
    console.error('Partners KV error, falling back to env seed:', err)
    return seedFromEnv()
  }
}

export async function savePartners(partners: Partner[]): Promise<void> {
  await kvSetString(PARTNERS_KEY, JSON.stringify(partners))
}
