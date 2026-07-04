import { NextResponse } from 'next/server'

const KV_URL = process.env.KV_REST_API_URL
const KV_TOKEN = process.env.KV_REST_API_TOKEN

async function kvGet(key: string) {
  const res = await fetch(`${KV_URL}/get/${key}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    cache: 'no-store',
  })
  const data = await res.json()
  return data.result
}

export async function GET() {
  try {
    const res = await fetch(`${KV_URL}/keys/inv:*`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
      cache: 'no-store',
    })
    const data = await res.json()
    const keys: string[] = data.result || []

    if (keys.length === 0) {
      return NextResponse.json({})
    }

    const inventory: Record<string, number> = {}
    await Promise.all(keys.map(async (key) => {
      const val = await kvGet(key)
      const sku = key.replace('inv:', '')
      inventory[sku] = parseInt(val) || 0
    }))

    return NextResponse.json(inventory)
  } catch (err) {
    console.error('Inventory fetch error:', err)
    return NextResponse.json({})
  }
}
