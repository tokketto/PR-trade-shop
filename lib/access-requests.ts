import { randomUUID } from 'crypto'
import { isKvConfigured, KvError, kvSetString, readJsonArray } from './kv'

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
  if (!isKvConfigured()) return []
  const stored = await readJsonArray<AccessRequest>(ACCESS_REQUESTS_KEY, 'access requests')
  if (stored === null) return []
  // Backfill fields for requests saved before id/status existed. This is not written back.
  return stored.map((r: AccessRequest) => ({
    ...r,
    id: r.id || `${r.email}-${r.submittedAt}`,
    status: r.status || 'pending',
  }))
}

export async function saveAccessRequests(requests: AccessRequest[]): Promise<void> {
  if (!isKvConfigured()) return
  const wrote = await kvSetString(ACCESS_REQUESTS_KEY, JSON.stringify(requests))
  if (!wrote) throw new KvError('Could not save — database unavailable')
}

export async function addAccessRequest(entry: Omit<AccessRequest, 'submittedAt' | 'id' | 'status'>): Promise<void> {
  if (!isKvConfigured()) return
  const existing = await getAccessRequests()
  const newEntry: AccessRequest = {
    ...entry,
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    status: 'pending',
  }
  await saveAccessRequests([...existing, newEntry])
}
