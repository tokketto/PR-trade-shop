const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

export async function kvGetString(key: string): Promise<string | null> {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return data.result ?? null
}

export async function kvSetString(key: string, value: string): Promise<void> {
  await fetch(`${KV_URL}/set/${key}/${encodeURIComponent(value)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  })
}
