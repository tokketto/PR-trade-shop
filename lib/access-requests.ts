import { kvGetString, kvSetString } from './kv'

export type AccessRequest = {
  company: string
  firstName: string
  lastName: string
  email: string
  submittedAt: string
}

const ACCESS_REQUESTS_KEY = 'access_requests'

export async function getAccessRequests(): Promise<AccessRequest[]> {
  try {
    const raw = await kvGetString(ACCESS_REQUESTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Access requests KV error:', err)
    return []
  }
}

export async function addAccessRequest(entry: Omit<AccessRequest, 'submittedAt'>): Promise<void> {
  const existing = await getAccessRequests()
  const updated = [...existing, { ...entry, submittedAt: new Date().toISOString() }]
  await kvSetString(ACCESS_REQUESTS_KEY, JSON.stringify(updated))
}
