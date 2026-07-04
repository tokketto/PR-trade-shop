export type Partner = {
  name: string
  code: string
  active: boolean
  isAdmin?: boolean
}

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN
const PARTNERS_KEY = 'partners'

async function kvGetString(key: string): Promise<string | null> {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return data.result ?? null
}

async function kvSetString(key: string, value: string) {
  await fetch(`${KV_URL}/set/${key}/${encodeURIComponent(value)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  })
}

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
