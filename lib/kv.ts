// Upstash REST client. Reads return null only when a successful response
// confirms the key is absent. Failures throw so callers cannot treat an
// outage as empty data and write over it.

const KV_URL_ENV = 'KV_REST_API_URL'
const KV_TOKEN_ENV = 'KV_REST_API_TOKEN'

export class KvError extends Error {
  readonly userFacing: boolean

  constructor(message: string, userFacing = false) {
    super(message)
    this.name = 'KvError'
    this.userFacing = userFacing
  }
}

type KvConfig = { url: string; token: string }

function kvConfig(): KvConfig | null {
  const url = process.env[KV_URL_ENV]
  const token = process.env[KV_TOKEN_ENV]
  if (!url || !token) return null
  return { url: url.replace(/\/$/, ''), token }
}

export function isKvConfigured(): boolean {
  return kvConfig() !== null
}

type KvBody = { result?: unknown; error?: unknown }

async function readKvBody(res: Response): Promise<KvBody> {
  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new KvError('Database returned an unreadable response')
  }
  if (!data || typeof data !== 'object') {
    throw new KvError('Database returned an unexpected response')
  }
  return data as KvBody
}

export async function kvGetString(key: string): Promise<string | null> {
  const config = kvConfig()
  if (!config) throw new KvError('KV is not configured')

  let res: Response
  try {
    res = await fetch(`${config.url}/get/${key}`, {
      headers: { Authorization: `Bearer ${config.token}` },
      cache: 'no-store',
    })
  } catch {
    throw new KvError('Could not reach the database')
  }

  if (!res.ok) {
    console.error('KV read failed with status', res.status)
    throw new KvError('Could not read from the database')
  }

  const data = await readKvBody(res)
  if (typeof data.error === 'string') {
    console.error('KV read returned an error')
    throw new KvError('Could not read from the database')
  }
  if (!('result' in data)) {
    throw new KvError('Database returned an unexpected response')
  }
  if (data.result === null) return null
  if (typeof data.result !== 'string') {
    throw new KvError('Database returned an unexpected response')
  }
  return data.result
}

// The value travels in the JSON command body. Putting it in the URL path
// fails once the payload exceeds typical URL length limits, and those
// failures were previously ignored.
export async function kvSetString(
  key: string,
  value: string,
  opts?: { onlyIfMissing?: boolean },
): Promise<boolean> {
  const config = kvConfig()
  if (!config) return false

  const command = opts?.onlyIfMissing
    ? ['SET', key, value, 'NX']
    : ['SET', key, value]

  let res: Response
  try {
    res = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    })
  } catch {
    throw new KvError('Could not reach the database')
  }

  if (!res.ok) {
    console.error('KV write failed with status', res.status)
    throw new KvError('Could not save — database unavailable')
  }

  const data = await readKvBody(res)
  if (typeof data.error === 'string') {
    console.error('KV write returned an error')
    throw new KvError('Could not save — database unavailable')
  }
  if (opts?.onlyIfMissing && data.result === null) return false
  if (data.result !== 'OK') {
    throw new KvError('Could not save — database unavailable')
  }
  return true
}

export function parseStoredJsonArray<T>(raw: string, label: string): T[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new KvError(`Stored ${label} data could not be read and was left unchanged`, true)
  }
  if (!Array.isArray(parsed)) {
    throw new KvError(`Stored ${label} data could not be read and was left unchanged`, true)
  }
  return parsed as T[]
}

// Null means the key is absent. Invalid JSON throws and must not be replaced.
export async function readJsonArray<T>(key: string, label: string): Promise<T[] | null> {
  const raw = await kvGetString(key)
  if (raw === null) return null
  return parseStoredJsonArray<T>(raw, label)
}

// Insert only when the key is still absent. If a concurrent writer created it,
// return that stored array instead of the candidate so the candidate is not saved.
export async function writeJsonArrayIfMissing<T>(key: string, value: T[], label: string): Promise<T[]> {
  const wrote = await kvSetString(key, JSON.stringify(value), { onlyIfMissing: true })
  if (wrote) return value
  const current = await kvGetString(key)
  if (current === null) {
    throw new KvError(`Could not save ${label} — database unavailable`)
  }
  return parseStoredJsonArray<T>(current, label)
}
