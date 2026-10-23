import { isKvConfigured, KvError, kvSetString, readJsonArray, writeJsonArrayIfMissing } from './kv'

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
  if (!isKvConfigured()) return seedFromEnv()
  const stored = await readJsonArray<Partner>(PARTNERS_KEY, 'partners')
  if (stored === null) return writeJsonArrayIfMissing(PARTNERS_KEY, seedFromEnv(), 'partners')
  return stored
}

export async function savePartners(partners: Partner[]): Promise<void> {
  if (!isKvConfigured()) return
  const wrote = await kvSetString(PARTNERS_KEY, JSON.stringify(partners))
  if (!wrote) throw new KvError('Could not save — database unavailable')
}
