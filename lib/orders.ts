import { randomUUID } from 'crypto'
import { isKvConfigured, KvError, kvSetString, readJsonArray } from './kv'

export type OrderItem = { name: string; code: string; qty: number }

export type Order = {
  id: string
  partnerName: string
  items: OrderItem[]
  submittedAt: string
}

const ORDERS_KEY = 'orders'

export async function getOrders(): Promise<Order[]> {
  if (!isKvConfigured()) return []
  const stored = await readJsonArray<Order>(ORDERS_KEY, 'orders')
  return stored ?? []
}

export async function addOrder(entry: { partnerName: string; items: OrderItem[] }): Promise<void> {
  if (!isKvConfigured()) return
  const existing = await getOrders()
  const newOrder: Order = { ...entry, id: randomUUID(), submittedAt: new Date().toISOString() }
  const wrote = await kvSetString(ORDERS_KEY, JSON.stringify([...existing, newOrder]))
  if (!wrote) throw new KvError('Could not save — database unavailable')
}
