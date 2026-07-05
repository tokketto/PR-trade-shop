import { randomUUID } from 'crypto'
import { kvGetString, kvSetString } from './kv'

export type AccessRequest = {
  id: string
  company: string
  firstName: string
  lastName: string
  email: string
  submittedAt: string
  status: 'pending' | 'approved'
}

const ACCESS_REQUESTS_KEY = 'access_requests'

export async function getAccessRequests(): Promise<AccessRequest[]> {
  try {
    const raw = await kvGetString(ACCESS_REQUESTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    // Backfill fields for requests saved before id/status existed
    return parsed.map((r: AccessRequest) => ({
      ...r,
      id: r.id || `${r.email}-${r.submittedAt}`,
      status: r.status || 'pending',
    }))
  } catch (err) {
    console.error('Access requests KV error:', err)
    return []
  }
}

export async function saveAccessRequests(requests: AccessRequest[]): Promise<void> {
  await kvSetString(ACCESS_REQUESTS_KEY, JSON.stringify(requests))
}

export async function addAccessRequest(entry: Omit<AccessRequest, 'submittedAt' | 'id' | 'status'>): Promise<void> {
  const existing = await getAccessRequests()
  const newEntry: AccessRequest = {
    ...entry,
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    status: 'pending',
  }
  await saveAccessRequests([...existing, newEntry])
}
